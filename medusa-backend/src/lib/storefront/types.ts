export type StorefrontFeelingBrowseAssignmentDTO = {
  feelingSlug: string
  /** Empty string when browse applies to the whole pillar (product linked only to that feeling category). */
  subfeelingSlug: string
}

export type StorefrontVariantDTO = {
  allow_backorder: boolean
  available: boolean
  currency_code: string
  id: string
  inventory_quantity: number | null
  is_discounted: boolean
  manage_inventory: boolean
  original_price_egp: number | null
  price_egp: number
  size: string
  sku: string | null
}

export type StorefrontMediaDTO = {
  gallery?: string[]
  main?: string | null
}

/** Native Medusa product / variant shipping attributes exposed on the storefront DTO (Admin “Attributes”). */
export type StorefrontProductPhysicalAttributesDTO = {
  weight?: string
  length?: string
  height?: string
  width?: string
  originCountry?: string
  hsCode?: string
  midCode?: string
  material?: string
}

export type StorefrontArtistDTO = {
  active: boolean
  avatarSrc?: string
  designCount: number
  name: string
  slug: string
  style: string
}

/** PDP artist line from Medusa `product.metadata.artist` (native); slug/module is fallback only. */
export type StorefrontProductArtistDisplayDTO = {
  name: string
  avatarUrl?: string
}

export type StorefrontProductDTO = {
  apparelCategoryPath?: string
  /** Resolved for PDP: metadata.artist first, else storefront_artist by artistSlug. */
  artistDisplay?: StorefrontProductArtistDisplayDTO
  artistSlug: string
  availableSizes?: string[]
  artworkSlug?: string
  capsuleSlugs?: string[]
  complementarySlugs?: string[]
  customersAlsoBoughtSlugs?: string[]
  decorationType?: "plain" | "graphic" | "embroidered" | "mixed"
  description?: string
  feelingSlug: string
  /** Thematic line under a feeling (emotions, zodiac, fiction, career, trends). */
  lineSlug?: string
  fitLabel?: string
  frequentlyBoughtWithSlugs?: string[]
  garmentColors?: string[]
  inventoryHintBySize?: Record<string, string>
  media?: StorefrontMediaDTO
  merchandisingBadge?: string
  name: string
  occasionSlugs: string[]
  originalPriceEgp?: number | null
  pdpFitModels?: Array<Record<string, unknown>>
  /** Weight / dimensions / HS, etc. from Medusa product (and default variant when product-level is empty). */
  physicalAttributes?: StorefrontProductPhysicalAttributesDTO
  defaultPriceSize?: string
  /** False when legacy metadata fallback is off and the product has no single valid branch under `feelings` — hide from feeling browse. */
  feelingBrowseEligible?: boolean
  /** All pillar/line placements from Medusa categories under `feelings` (normalized); browse should match any. */
  feelingBrowseAssignments?: StorefrontFeelingBrowseAssignmentDTO[]
  primaryFeelingSlug: string
  primaryOccasionSlug?: string
  primarySubfeelingSlug: string
  priceEgp: number
  slug: string
  stockNote?: string
  story: string
  thumbnail?: string | null
  trustBadges?: string[]
  useCase?: string
  variantsBySize: Record<string, StorefrontVariantDTO>
  wearerStories?: Array<Record<string, unknown>>
}

export type StorefrontFeelingDTO = {
  accent?: string
  active: boolean
  blurb: string
  cardImageAlt: string
  cardImageSrc: string
  heroImageAlt: string
  heroImageSrc: string
  manifesto?: string
  name: string
  seoDescription?: string
  seoTitle?: string
  slug: string
  sortOrder: number
  tagline?: string
}

export type StorefrontSubfeelingDTO = {
  active: boolean
  blurb: string
  cardImageAlt: string
  cardImageSrc: string
  feelingSlug: string
  heroImageAlt: string
  heroImageSrc: string
  name: string
  seoDescription?: string
  seoTitle?: string
  slug: string
  sortOrder: number
}

export type StorefrontOccasionDTO = {
  accent?: string
  active: boolean
  blurb: string
  cardImageAlt: string
  cardImageSrc: string
  heroImageAlt: string
  heroImageSrc: string
  isGiftOccasion: boolean
  name: string
  priceHint?: string
  productHandles: string[]
  seoDescription?: string
  seoTitle?: string
  slug: string
  sortOrder: number
}

export type StorefrontMerchEventDTO = {
  active: boolean
  body: string
  cardImageAlt?: string
  cardImageSrc?: string
  endsAt?: string
  heroImageAlt?: string
  heroImageSrc?: string
  name: string
  occasionSlug?: string
  productHandles: string[]
  seoDescription?: string
  seoTitle?: string
  slug: string
  sortOrder: number
  startsAt?: string
  status: string
  teaser: string
  type: string
}

export type StorefrontCatalogDTO = {
  artists: StorefrontArtistDTO[]
  events: StorefrontMerchEventDTO[]
  feelings: StorefrontFeelingDTO[]
  occasions: StorefrontOccasionDTO[]
  products: StorefrontProductDTO[]
  subfeelings: StorefrontSubfeelingDTO[]
}
