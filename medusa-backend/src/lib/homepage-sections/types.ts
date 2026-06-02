export const HOMEPAGE_SECTION_TYPES = [
  "hero",
  "trust_ribbon",
  "primary_routes",
  "founding_drop",
  "featured_piece",
  "feeling_grid",
  "occasion_grid",
  "gift_block",
  "why_horo",
  "first_drop_circle",
  "proof_strip",
  "seen_on_you",
  "artist_spotlight",
  "editorial_feature",
] as const

export type HomepageSectionType = typeof HOMEPAGE_SECTION_TYPES[number]

export type AdminHomepageSection = {
  id: string
  key: string
  type: HomepageSectionType
  eyebrowEn: string | null
  eyebrowAr: string | null
  titleEn: string | null
  titleAr: string | null
  bodyEn: string | null
  bodyAr: string | null
  primaryCtaLabelEn: string | null
  primaryCtaLabelAr: string | null
  primaryCtaHref: string | null
  secondaryCtaLabelEn: string | null
  secondaryCtaLabelAr: string | null
  secondaryCtaHref: string | null
  imageSrc: string | null
  imageAltEn: string | null
  imageAltAr: string | null
  accent: string | null
  sortOrder: number
  active: boolean
  payload: Record<string, unknown> | null
  createdAt?: string | null
  updatedAt?: string | null
}

export type HomepageSectionInput = {
  key?: string
  type?: HomepageSectionType
  eyebrow_en?: string | null
  eyebrow_ar?: string | null
  title_en?: string | null
  title_ar?: string | null
  body_en?: string | null
  body_ar?: string | null
  primary_cta_label_en?: string | null
  primary_cta_label_ar?: string | null
  primary_cta_href?: string | null
  secondary_cta_label_en?: string | null
  secondary_cta_label_ar?: string | null
  secondary_cta_href?: string | null
  image_src?: string | null
  image_alt_en?: string | null
  image_alt_ar?: string | null
  accent?: string | null
  sort_order?: number
  active?: boolean
  payload?: Record<string, unknown> | null
}

export type HomepageSectionValidationIssue = {
  field: string
  message: string
}

export type HomepageSectionListFilters = {
  type?: HomepageSectionType
  active?: boolean
}

export type HomepageSectionReorderItem = {
  id: string
  sort_order: number
}
