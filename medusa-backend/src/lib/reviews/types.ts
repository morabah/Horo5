export const REVIEW_STATUSES = ["pending", "approved", "rejected"] as const
export const REVIEW_UGC_TYPES = ["review", "photo", "video", "delivery_reaction"] as const
export const REVIEW_SOURCES = ["post_delivery_whatsapp", "website", "manual_admin", "instagram"] as const

export type ReviewStatus = typeof REVIEW_STATUSES[number]
export type ReviewUgcType = typeof REVIEW_UGC_TYPES[number]
export type ReviewSource = typeof REVIEW_SOURCES[number]

export type AdminReview = {
  id: string
  productId: string
  productTitle: string | null
  customerId: string | null
  rating: number
  body: string
  locale: string
  status: ReviewStatus
  photoUrl: string | null
  videoUrl: string | null
  instagramHandle: string | null
  permissionToRepost: boolean
  fitFeedback: string | null
  giftFeedback: string | null
  ugcType: ReviewUgcType
  source: ReviewSource
  createdAt: string | null
}

export type ReviewStatusFilter = ReviewStatus | undefined
