import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { bulkUpdateReviewStatus, isReviewStatus, listAdminReviews } from "../../../../lib/reviews/admin"
import type { ReviewStatus } from "../../../../lib/reviews/types"
import { assertTaxonomyAdminWrite } from "../taxonomy-auth"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const statusFilter = req.query.status as ReviewStatus | undefined
  const productId = req.query.product_id as string | undefined
  const limit = Math.min(Number(req.query.limit) || 50, 200)
  const offset = Number(req.query.offset) || 0

  if (statusFilter && !isReviewStatus(statusFilter)) {
    res.status(400).json({ message: "Invalid review status filter." })
    return
  }

  const result = await listAdminReviews(req.scope, {
    status: statusFilter,
    product_id: productId,
  }, { limit, offset })

  res.status(200).json(result)
}

export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  if (!assertTaxonomyAdminWrite(req, res)) {
    return
  }

  const body = (req.body || {}) as Record<string, unknown>
  const ids = body.ids as string[] | undefined
  const status = body.status as ReviewStatus | undefined

  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ message: "ids array is required" })
    return
  }

  if (!isReviewStatus(status)) {
    res.status(400).json({ message: "Valid status is required (approved, rejected, or pending)." })
    return
  }

  const result = await bulkUpdateReviewStatus(req.scope, ids, status)
  res.status(200).json(result)
}
