export const MERCH_EVENT_STATUSES = ["draft", "scheduled", "active", "archived"] as const

export type MerchEventStatus = typeof MERCH_EVENT_STATUSES[number]

export const MERCH_EVENT_TYPES = [
  "campaign",
  "sale",
  "launch",
  "drop",
  "collab",
  "seasonal",
  "gift",
  "edit",
  "other",
] as const

export type MerchEventType = typeof MERCH_EVENT_TYPES[number]

export type AdminMerchEvent = {
  id: string
  slug: string
  name: string
  type: MerchEventType
  teaser: string
  body: string
  status: MerchEventStatus
  startsAt: string | null
  endsAt: string | null
  heroImageSrc: string | null
  heroImageAlt: string | null
  cardImageSrc: string | null
  cardImageAlt: string | null
  seoTitle: string | null
  seoDescription: string | null
  sortOrder: number
  active: boolean
  productHandles: string[]
  occasionSlug: string | null
  linkedProductCount?: number
  createdAt?: string | null
  updatedAt?: string | null
}

export type MerchEventInput = {
  slug?: string
  name?: string
  type?: MerchEventType
  teaser?: string
  body?: string
  status?: MerchEventStatus
  starts_at?: string | null
  ends_at?: string | null
  hero_image_src?: string | null
  hero_image_alt?: string | null
  card_image_src?: string | null
  card_image_alt?: string | null
  seo_title?: string | null
  seo_description?: string | null
  sort_order?: number
  active?: boolean
  product_handles?: string[]
  occasion_slug?: string | null
}

export type MerchEventValidationIssue = {
  field: string
  message: string
}

export type NormalizedMerchEventInput = {
  slug?: string
  name?: string
  type?: string
  teaser?: string
  body?: string
  status?: MerchEventStatus
  starts_at?: string | null
  ends_at?: string | null
  hero_image_src?: string | null
  hero_image_alt?: string | null
  card_image_src?: string | null
  card_image_alt?: string | null
  seo_title?: string | null
  seo_description?: string | null
  sort_order?: number
  active?: boolean
  product_handles?: string[]
  occasion_slug?: string | null
}

export type MerchEventResult =
  | {
      ok: true
      data: NormalizedMerchEventInput
      event?: AdminMerchEvent
    }
  | {
      ok: false
      issues: MerchEventValidationIssue[]
    }

export type MerchEventListFilters = {
  q?: string
  status?: MerchEventStatus
  type?: string
  active?: boolean
  limit?: number
  offset?: number
}
