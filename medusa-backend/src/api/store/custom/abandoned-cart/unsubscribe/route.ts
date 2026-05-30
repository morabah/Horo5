import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { verifyUnsubscribeToken } from "../../../../../lib/cart-recover-token"
import { STOREFRONT_ABANDONED_CART_MODULE } from "../../../../../modules/storefront-abandoned-cart"
import type StorefrontAbandonedCartModuleService from "../../../../../modules/storefront-abandoned-cart/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const token = String(req.query.token || "").trim()
  const email = verifyUnsubscribeToken(token)

  if (!email) {
    res.status(400).json({ ok: false, error: "Invalid or expired unsubscribe link." })
    return
  }

  const service = req.scope.resolve<StorefrontAbandonedCartModuleService>(
    STOREFRONT_ABANDONED_CART_MODULE,
  )

  const rows = await service.listStorefrontAbandonedCarts({ email }, { take: 50 })
  const now = new Date()

  for (const row of rows) {
    if (!row.id) continue
    await service.updateStorefrontAbandonedCarts({
      id: row.id,
      suppressed_at: now,
      reminder_sent_at: now,
    })
  }

  res.status(200).json({ ok: true, email })
}
