import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { sendAbandonedCartReminderResend } from "../lib/abandoned-cart-email"
import { STOREFRONT_ABANDONED_CART_MODULE } from "../modules/storefront-abandoned-cart"
import type StorefrontAbandonedCartModuleService from "../modules/storefront-abandoned-cart/service"

type QueryCart = {
  id: string
  completed_at?: string | null
  items?: Array<{ id?: string } | null> | null
}

type AbandonedRow = {
  id: string
  email: string
  cart_id?: string | null
  locale?: string | null
  cart_value_egp?: number | null
  created_at?: string | Date | null
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
  const cutoff = new Date(Date.now() - delayMs())

  const pending = await service.listStorefrontAbandonedCarts(
    { reminder_sent_at: null },
    { take: 200 },
  )

  const due = (pending as AbandonedRow[]).filter((row) => {
    if (!row.created_at) return false
    const created = new Date(row.created_at)
    return !Number.isNaN(created.getTime()) && created.getTime() <= cutoff.getTime()
  })

  if (!due.length) {
    logger.info("[abandoned-cart-reminder] No due reminders.")
    return
  }

  let sent = 0
  for (const row of due) {
    if (row.cart_id) {
      try {
        const { data: carts } = await query.graph({
          entity: "cart",
          fields: ["id", "completed_at", "items.id"],
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
          continue
        }
      } catch (e) {
        logger.warn(
          `[abandoned-cart-reminder] cart ${row.cart_id} lookup failed: ${e instanceof Error ? e.message : String(e)}`,
        )
      }
    }

    const locale = row.locale === "ar" ? "ar" : "en"
    const result = await sendAbandonedCartReminderResend({
      apiKey,
      from,
      to: row.email,
      locale,
      storeUrl: site,
      cartValueEgp: row.cart_value_egp,
    })

    if (result.ok) {
      await service.updateStorefrontAbandonedCarts({
        id: row.id,
        reminder_sent_at: new Date(),
      })
      sent += 1
    } else {
      logger.warn(
        `[abandoned-cart-reminder] Failed email to ${row.email}: ${result.error ?? "unknown"}`,
      )
    }
  }

  logger.info(`[abandoned-cart-reminder] Sent ${sent}/${due.length} reminder(s).`)
}

export const config = {
  name: "abandoned-cart-reminder",
  schedule: "0 */2 * * *",
}
