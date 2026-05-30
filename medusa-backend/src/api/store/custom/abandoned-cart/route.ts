import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { STOREFRONT_ABANDONED_CART_MODULE } from "../../../../modules/storefront-abandoned-cart"
import type StorefrontAbandonedCartModuleService from "../../../../modules/storefront-abandoned-cart/service"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body || {}) as Record<string, unknown>
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
  const cartId = typeof body.cart_id === "string" ? body.cart_id.trim() : null
  const surface = typeof body.surface === "string" ? body.surface.trim() : "cart"
  const locale = typeof body.locale === "string" && body.locale === "ar" ? "ar" : "en"
  const cartValueRaw = body.cart_value_egp
  const cartValueEgp =
    typeof cartValueRaw === "number" && Number.isFinite(cartValueRaw)
      ? Math.max(0, Math.round(cartValueRaw))
      : null

  if (!email || !EMAIL_RE.test(email)) {
    res.status(400).json({ ok: false, error: "A valid email is required." })
    return
  }

  const service = req.scope.resolve<StorefrontAbandonedCartModuleService>(
    STOREFRONT_ABANDONED_CART_MODULE,
  )

  const existing = cartId
    ? await service.listStorefrontAbandonedCarts({ email, cart_id: cartId }, { take: 1 })
    : await service.listStorefrontAbandonedCarts({ email }, { take: 1 })

  if (existing[0]?.id) {
    await service.updateStorefrontAbandonedCarts({
      id: existing[0].id,
      surface,
      locale,
      cart_value_egp: cartValueEgp,
      reminder_sent_at: null,
    })
    res.status(200).json({ ok: true, updated: true })
    return
  }

  await service.createStorefrontAbandonedCarts({
    email,
    cart_id: cartId,
    surface,
    locale,
    cart_value_egp: cartValueEgp,
  })

  res.status(201).json({ ok: true, created: true })
}
