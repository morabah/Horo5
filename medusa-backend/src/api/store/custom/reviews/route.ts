import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { PRODUCT_REVIEW_MODULE } from "../../../../modules/product-review"
import type ProductReviewModuleService from "../../../../modules/product-review/service"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body || {}) as Record<string, unknown>
  const productId = typeof body.product_id === "string" ? body.product_id.trim() : ""
  const reviewBody = typeof body.body === "string" ? body.body.trim() : ""
  const locale = typeof body.locale === "string" && body.locale === "ar" ? "ar" : "en"
  const photoUrl = typeof body.photo_url === "string" ? body.photo_url.trim() : null
  const instagramHandle =
    typeof body.instagram_handle === "string" ? body.instagram_handle.trim() : null
  const permissionToRepost = body.permission_to_repost === true
  const ugcType =
    body.ugc_type === "photo" || body.ugc_type === "video" || body.ugc_type === "delivery_reaction"
      ? body.ugc_type
      : "review"
  const fitFeedback = typeof body.fit_feedback === "string" ? body.fit_feedback.trim() : null
  const giftFeedback = typeof body.gift_feedback === "string" ? body.gift_feedback.trim() : null
  const customerEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""

  if (!productId) {
    res.status(400).json({ ok: false, error: "product_id is required." })
    return
  }

  if (!reviewBody && !photoUrl) {
    res.status(400).json({ ok: false, error: "body or photo_url is required." })
    return
  }

  if (customerEmail && !EMAIL_RE.test(customerEmail)) {
    res.status(400).json({ ok: false, error: "Invalid email." })
    return
  }

  const service = req.scope.resolve<ProductReviewModuleService>(PRODUCT_REVIEW_MODULE)

  const created = await service.createProductReviews({
    product_id: productId,
    rating: 5,
    body: reviewBody || (photoUrl ? "UGC photo submission" : ""),
    locale,
    status: "pending",
    photo_url: photoUrl,
    instagram_handle: instagramHandle,
    permission_to_repost: permissionToRepost,
    fit_feedback: fitFeedback,
    gift_feedback: giftFeedback,
    ugc_type: ugcType,
    source: "website",
  })

  res.status(201).json({ ok: true, review: created })
}
