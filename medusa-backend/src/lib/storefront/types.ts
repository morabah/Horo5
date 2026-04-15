export type StorefrontFeelingBrowseAssignmentDTO = {
  feelingSlug: string
  /** Empty string when browse applies to the whole pillar (product linked only to that feeling category). */
  subfeelingSlug: string
}

export type StorefrontMediaDTO = {
  gallery?: string[]
  main?: string | null
  /** Base64 data URL for Next.js `placeholder="blur"` (optional; set via `product.metadata.media`). */
  blurDataUrlMain?: string | null
  /** CSS color e.g. `#1a1a1a` for skeleton / theme hints. */
  dominantColorMain?: string | null
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
  /** Option value when a `Color` product option exists. */
  color?: string
  /** Per-variant gallery from `variant.metadata.media` when set. */
  media?: StorefrontMediaDTO
  sku: string | null
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
  /** Preset key under `store.metadata.sizeTables` (e.g. `regular`, `oversized`). */
  sizeTableKey?: string
  frequentlyBoughtWithSlugs?: string[]
  garmentColors?: string[]
  inventoryHintBySize?: Record<string, string>
  stockStatusBySize?: Record<string, "in_stock" | "low_stock" | "sold_out" | "preorder">
  fitBySize?: Record<
    string,
    {
      bust_cm?: number
      length_cm?: number
      sleeve_cm?: number
      rise_cm?: number
      inseam_cm?: number
    }
  >
  launchAt?: string
  sunsetAt?: string
  media?: StorefrontMediaDTO
  merchandisingBadge?: string
  name: string
  /**
   * PDP hero tags: linked product category display names from Medusa (Admin → Organize → Categories),
   * excluding the internal `feelings` root. Not derived from `metadata.occasionSlugs`.
   */
  pdpTagLabels?: string[]
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
  /** Campaign line from `metadata.promoLabel` (hidden when `metadata.promo_ends_at` is past). */
  promoLabel?: string
  priceEgp: number
  slug: string
  stockNote?: string
  story: string
  thumbnail?: string | null
  /** ISO from Medusa `product.updated_at` (sitemap / freshness). */
  updatedAt?: string
  trustBadges?: string[]
  useCase?: string
  variantsBySize: Record<string, StorefrontVariantDTO>
  /**
   * Present when every variant has a Color option and at least two distinct colors.
   * `variantsBySize` is the default color row (first available variant’s color, else sorted first).
   */
  variantsByColor?: Record<string, StorefrontVariantDTO[]>
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
