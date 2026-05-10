import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { PDP_WAITLIST_MODULE } from "../../../../modules/pdp-waitlist"
import type PdpWaitlistModuleService from "../../../../modules/pdp-waitlist/service"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body || {}) as Record<string, unknown>
  const productId = typeof body.product_id === "string" ? body.product_id.trim() : ""
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
  const locale = typeof body.locale === "string" ? body.locale.trim().toLowerCase() : "en"

  if (!productId) {
    res.status(400).json({ ok: false, error: "product_id is required." })
    return
  }
  if (!email || !EMAIL_RE.test(email)) {
    res.status(400).json({ ok: false, error: "A valid email is required." })
    return
  }

  const service = req.scope.resolve<PdpWaitlistModuleService>(PDP_WAITLIST_MODULE)

  // Dedupe: check if already signed up for this product
  const existing = await service.listPdpWaitlists(
    { product_id: productId, email },
    { take: 1 }
  )

  if (existing.length > 0) {
    res.status(200).json({ ok: true, duplicate: true })
    return
  }

  const created = await service.createPdpWaitlists({
    product_id: productId,
    email,
    locale: locale === "ar" ? "ar" : "en",
  })

  res.status(201).json({
    ok: true,
    duplicate: false,
    pdp_waitlist: created,
  })
}
