export const REVIEW_STATUSES = ["pending", "approved", "rejected"] as const

export type ReviewStatus = typeof REVIEW_STATUSES[number]

export type AdminReview = {
  id: string
  productId: string
  productTitle: string | null
  customerId: string | null
  rating: number
  body: string
  locale: string
  status: ReviewStatus
  createdAt: string | null
}

export type ReviewStatusFilter = ReviewStatus | undefined
