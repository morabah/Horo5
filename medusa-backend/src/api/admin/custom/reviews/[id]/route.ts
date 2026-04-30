import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { isReviewStatus, retrieveAdminReview, validateReviewStatusTransition } from "../../../../../lib/reviews/admin"
import type { ReviewStatus } from "../../../../../lib/reviews/types"
import { PRODUCT_REVIEW_MODULE } from "../../../../../modules/product-review"
import type ProductReviewModuleService from "../../../../../modules/product-review/service"
import { assertTaxonomyAdminWrite } from "../../taxonomy-auth"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const id = req.params?.id as string | undefined
  if (!id) {
    res.status(400).json({ message: "Missing id" })
    return
  }

  const review = await retrieveAdminReview(req.scope, id)
  if (!review) {
    res.status(404).json({ message: "Not found" })
    return
  }

  res.status(200).json({ review })
}

export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  if (!assertTaxonomyAdminWrite(req, res)) {
    return
  }

  const id = req.params?.id as string | undefined
  if (!id) {
    res.status(400).json({ message: "Missing id" })
    return
  }

  const existing = await retrieveAdminReview(req.scope, id)
  if (!existing) {
    res.status(404).json({ message: "Not found" })
    return
  }

  const body = (req.body || {}) as Record<string, unknown>
  const status = body.status as ReviewStatus | undefined

  if (!isReviewStatus(status)) {
    res.status(400).json({ message: "Valid status is required." })
    return
  }

  if (!validateReviewStatusTransition(existing.status, status)) {
    res.status(422).json({ message: `Cannot transition from "${existing.status}" to "${status}".` })
    return
  }

  const service = req.scope.resolve<ProductReviewModuleService>(PRODUCT_REVIEW_MODULE)
  await service.updateProductReviews({
    selector: { id },
    data: { status },
  })

  const review = await retrieveAdminReview(req.scope, id)
  res.status(200).json({ review })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  if (!assertTaxonomyAdminWrite(req, res)) {
    return
  }

  const id = req.params?.id as string | undefined
  if (!id) {
    res.status(400).json({ message: "Missing id" })
    return
  }

  const service = req.scope.resolve<ProductReviewModuleService>(PRODUCT_REVIEW_MODULE)
  await service.deleteProductReviews(id)

  res.status(204).send()
}
