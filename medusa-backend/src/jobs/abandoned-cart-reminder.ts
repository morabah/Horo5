import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { MAX_REMINDERS_PER_LEAD } from "../lib/abandoned-cart-guard"
import {
  buildUnsubscribeUrl,
  sendAbandonedCartReminderResend,
  type AbandonCartLinePreview,
} from "../lib/abandoned-cart-email"
import { STOREFRONT_ABANDONED_CART_MODULE } from "../modules/storefront-abandoned-cart"
import type StorefrontAbandonedCartModuleService from "../modules/storefront-abandoned-cart/service"

type QueryCartItem = {
  id?: string
  quantity?: number
  title?: string | null
  thumbnail?: string | null
}

type QueryCart = {
  id: string
  completed_at?: string | null
  items?: Array<QueryCartItem | null> | null
}

type AbandonedRow = {
  id: string
  email: string
  cart_id?: string | null
  locale?: string | null
  cart_value_egp?: number | null
  created_at?: string | Date | null
  last_captured_at?: string | Date | null
  reminder_count?: number | null
  suppressed_at?: string | Date | null
  consent_given?: boolean | null
}

function delayMs(): number {
  const minutes = parseInt(String(process.env.HORO_ABANDON_CART_DELAY_MINUTES ?? "60"), 10)
  const safe = Number.isFinite(minutes) && minutes > 0 ? minutes : 60
  return safe * 60 * 1000
}

function storeUrl(): string | null {
  const raw =
    process.env.STOREFRONT_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.MEDUSA_STOREFRONT_URL?.trim()
  return raw || null
}

function captureTime(row: AbandonedRow): number {
  const raw = row.last_captured_at ?? row.created_at
  if (!raw) return 0
  const t = new Date(raw).getTime()
  return Number.isNaN(t) ? 0 : t
}

export default async function abandonedCartReminderJob(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const from = process.env.ORDER_CONFIRMATION_FROM?.trim()
  const site = storeUrl()

  if (!apiKey || !from || !site) {
    logger.info(
      "[abandoned-cart-reminder] RESEND_API_KEY, ORDER_CONFIRMATION_FROM, or STOREFRONT_URL unset; skip.",
    )
    return
  }

  const service = container.resolve<StorefrontAbandonedCartModuleService>(
    STOREFRONT_ABANDONED_CART_MODULE,
  )
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const cutoff = Date.now() - delayMs()

  const pending = await service.listStorefrontAbandonedCarts(
    { reminder_sent_at: null },
    { take: 200 },
  )

  const due = (pending as AbandonedRow[]).filter((row) => {
    if (row.suppressed_at || row.consent_given === false) return false
    if ((row.reminder_count ?? 0) >= MAX_REMINDERS_PER_LEAD) return false
    const captured = captureTime(row)
    return captured > 0 && captured <= cutoff
  })

  if (!due.length) {
    logger.info("[abandoned-cart-reminder] No due reminders.")
    return
  }

  let sent = 0
  let skipped = 0

  for (const row of due) {
    if (row.cart_id) {
      try {
        const { data: carts } = await query.graph({
          entity: "cart",
          fields: ["id", "completed_at", "items.id", "items.quantity", "items.title", "items.thumbnail"],
          filters: { id: row.cart_id },
          pagination: { take: 1 },
        })
        const cart = (carts?.[0] as QueryCart | undefined) ?? null
        const itemCount = cart?.items?.filter(Boolean).length ?? 0
        if (!cart || cart.completed_at || itemCount === 0) {
          await service.updateStorefrontAbandonedCarts({
            id: row.id,
            reminder_sent_at: new Date(),
          })
          skipped += 1
          continue
        }
      } catch (e) {
        logger.warn(
          `[abandoned-cart-reminder] cart ${row.cart_id} lookup failed; will retry later: ${e instanceof Error ? e.message : String(e)}`,
        )
        skipped += 1
        continue
      }
    }

    const locale = row.locale === "ar" ? "ar" : "en"
    const unsubscribeUrl = buildUnsubscribeUrl(site, row.email)
    let lines: AbandonCartLinePreview[] | undefined
    if (row.cart_id) {
      try {
        const { data: carts } = await query.graph({
          entity: "cart",
          fields: ["items.title", "items.quantity", "items.thumbnail"],
          filters: { id: row.cart_id },
          pagination: { take: 1 },
        })
        const cartForLines = (carts?.[0] as QueryCart | undefined) ?? null
        const preview = (cartForLines?.items ?? [])
          .filter(Boolean)
          .map((item) => ({
            title: String(item?.title ?? "").trim() || "Item",
            quantity: Math.max(1, Number(item?.quantity) || 1),
            thumbnailUrl: item?.thumbnail ?? null,
          }))
          .filter((item) => item.title)
        if (preview.length) lines = preview
      } catch {
        /* omit lines if cart fetch fails */
      }
    }
    const result = await sendAbandonedCartReminderResend({
      apiKey,
      from,
      to: row.email,
      locale,
      storeUrl: site,
      cartValueEgp: row.cart_value_egp,
      cartId: row.cart_id,
      unsubscribeUrl,
      lines,
    })

    if (result.ok) {
      await service.updateStorefrontAbandonedCarts({
        id: row.id,
        reminder_sent_at: new Date(),
        reminder_count: (row.reminder_count ?? 0) + 1,
      })
      sent += 1
    } else {
      logger.warn(
        `[abandoned-cart-reminder] Failed email to ${row.email}: ${result.error ?? "unknown"}`,
      )
    }
  }

  logger.info(
    `[abandoned-cart-reminder] Sent ${sent}, skipped ${skipped}, due ${due.length}.`,
  )
}

export const config = {
  name: "abandoned-cart-reminder",
  schedule: "0 */2 * * *",
}
