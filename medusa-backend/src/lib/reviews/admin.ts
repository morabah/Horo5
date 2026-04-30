import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/types"

import { PRODUCT_REVIEW_MODULE } from "../../modules/product-review"
import type ProductReviewModuleService from "../../modules/product-review/service"
import { REVIEW_STATUSES, type AdminReview, type ReviewStatus } from "./types"

type ReviewRecord = {
  id: string
  product_id?: string | null
  customer_id?: string | null
  rating?: number | null
  body?: string | null
  locale?: string | null
  status?: string | null
  created_at?: Date | string | null
}

function serializeDate(value: Date | string | null | undefined): string | null {
  if (!value) return null
  if (value instanceof Date) return value.toISOString()
  const ms = Date.parse(String(value))
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null
}

export async function buildAdminReview(scope: MedusaContainer, record: ReviewRecord): Promise<AdminReview> {
  let productTitle: string | null = null

  if (record.product_id) {
    try {
      const query = scope.resolve(ContainerRegistrationKeys.QUERY)
      const { data } = await query.graph({
        entity: "product",
        fields: ["id", "title"],
        filters: { id: record.product_id },
      })
      productTitle = (data as Array<{ title?: string }>)[0]?.title || null
    } catch {
      // product may have been deleted
    }
  }

  return {
    id: record.id,
    productId: record.product_id || "",
    productTitle,
    customerId: record.customer_id || null,
    rating: Number(record.rating || 0),
    body: record.body || "",
    locale: record.locale || "en",
    status: (REVIEW_STATUSES.includes(record.status as ReviewStatus) ? record.status : "pending") as ReviewStatus,
    createdAt: serializeDate(record.created_at),
  }
}

export async function listAdminReviews(
  scope: MedusaContainer,
  filters: { status?: ReviewStatus; product_id?: string } = {},
  pagination: { limit?: number; offset?: number } = {},
): Promise<{ reviews: AdminReview[]; count: number }> {
  const service = scope.resolve<ProductReviewModuleService>(PRODUCT_REVIEW_MODULE)

  const serviceFilters: Record<string, unknown> = {}
  if (filters.status) serviceFilters.status = filters.status
  if (filters.product_id) serviceFilters.product_id = filters.product_id

  const limit = pagination.limit || 50
  const offset = pagination.offset || 0

  const [rows, countResult] = await Promise.all([
    service.listProductReviews(serviceFilters, { take: limit, skip: offset }) as Promise<ReviewRecord[]>,
    service.listProductReviews(serviceFilters) as Promise<ReviewRecord[]>,
  ])

  const reviews = await Promise.all(rows.map((r) => buildAdminReview(scope, r)))

  return { reviews, count: countResult.length }
}

export async function retrieveAdminReview(scope: MedusaContainer, id: string): Promise<AdminReview | null> {
  const service = scope.resolve<ProductReviewModuleService>(PRODUCT_REVIEW_MODULE)
  const rows = await service.listProductReviews({ id }) as ReviewRecord[]
  const row = rows[0]
  if (!row) return null
  return buildAdminReview(scope, row)
}

export function validateReviewStatusTransition(current: ReviewStatus, next: ReviewStatus): boolean {
  if (current === next) return true
  if (current === "pending") return next === "approved" || next === "rejected"
  if (current === "rejected") return next === "pending" || next === "approved"
  if (current === "approved") return next === "pending" || next === "rejected"
  return false
}

export function isReviewStatus(value: unknown): value is ReviewStatus {
  return REVIEW_STATUSES.includes(value as ReviewStatus)
}

export async function bulkUpdateReviewStatus(
  scope: MedusaContainer,
  ids: string[],
  status: ReviewStatus,
): Promise<{ updated: number; errors?: string[] }> {
  const service = scope.resolve<ProductReviewModuleService>(PRODUCT_REVIEW_MODULE)
  const errors: string[] = []

  for (const id of ids) {
    const review = await retrieveAdminReview(scope, id)
    if (!review) {
      errors.push(`Review ${id} not found.`)
      continue
    }

    if (!validateReviewStatusTransition(review.status, status)) {
      errors.push(`Cannot transition review ${id} from "${review.status}" to "${status}".`)
      continue
    }

    await service.updateProductReviews({
      selector: { id },
      data: { status },
    })
  }

  return {
    updated: ids.length - errors.length,
    ...(errors.length ? { errors } : {}),
  }
}
