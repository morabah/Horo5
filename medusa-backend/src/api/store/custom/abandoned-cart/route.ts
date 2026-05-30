import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  allowAbandonCapture,
  MAX_REMINDERS_PER_LEAD,
  normalizedCartKey,
} from "../../../../lib/abandoned-cart-guard"
import { STOREFRONT_ABANDONED_CART_MODULE } from "../../../../modules/storefront-abandoned-cart"
import type StorefrontAbandonedCartModuleService from "../../../../modules/storefront-abandoned-cart/service"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const MIN_REMINDER_GAP_MS =
  parseInt(process.env.HORO_ABANDON_MIN_REMINDER_GAP_MS ?? "86400000", 10) || 86_400_000

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body || {}) as Record<string, unknown>
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
  const cartId = typeof body.cart_id === "string" ? body.cart_id.trim() : null
  const surface = typeof body.surface === "string" ? body.surface.trim() : "cart"
  const locale = typeof body.locale === "string" && body.locale === "ar" ? "ar" : "en"
  const consentGiven = body.marketing_consent === true
  const cartValueRaw = body.cart_value_egp
  const cartValueEgp =
    typeof cartValueRaw === "number" && Number.isFinite(cartValueRaw)
      ? Math.max(0, Math.round(cartValueRaw))
      : null

  if (!email || !EMAIL_RE.test(email)) {
    res.status(400).json({ ok: false, error: "A valid email is required." })
    return
  }

  if (!consentGiven) {
    res.status(400).json({ ok: false, error: "Marketing consent is required." })
    return
  }

  if (!allowAbandonCapture(req, email)) {
    res.status(429).json({ ok: false, error: "Too many requests. Please try again later." })
    return
  }

  const service = req.scope.resolve<StorefrontAbandonedCartModuleService>(
    STOREFRONT_ABANDONED_CART_MODULE,
  )

  const cartKey = normalizedCartKey(email, cartId)
  const existing = await service.listStorefrontAbandonedCarts(
    { normalized_cart_key: cartKey },
    { take: 1 },
  )

  const now = new Date()

  if (existing[0]?.id) {
    const row = existing[0]
    if (row.suppressed_at) {
      res.status(200).json({ ok: true, suppressed: true })
      return
    }

    const lastSent = row.reminder_sent_at ? new Date(row.reminder_sent_at as string | Date) : null
    const canResetReminder =
      !lastSent || Date.now() - lastSent.getTime() >= MIN_REMINDER_GAP_MS

    await service.updateStorefrontAbandonedCarts({
      id: row.id,
      surface,
      locale,
      cart_value_egp: cartValueEgp,
      consent_given: true,
      last_captured_at: now,
      ...(canResetReminder && (row.reminder_count ?? 0) < MAX_REMINDERS_PER_LEAD
        ? { reminder_sent_at: null }
        : {}),
    })
    res.status(200).json({ ok: true, updated: true })
    return
  }

  await service.createStorefrontAbandonedCarts({
    email,
    cart_id: cartId,
    normalized_cart_key: cartKey,
    surface,
    locale,
    cart_value_egp: cartValueEgp,
    consent_given: true,
    last_captured_at: now,
    reminder_count: 0,
  })

  res.status(201).json({ ok: true, created: true })
}
