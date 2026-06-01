import type { LocalizedText } from "./store-settings"

export type StorefrontMediaGalleryTag =
  | "proof_fabric"
  | "proof_print"
  | "proof_wash"
  | "lifestyle"
  | "flat_lay"

export type StorefrontMediaGalleryItemDTO = {
  url: string
  tag?: StorefrontMediaGalleryTag
}

export type StorefrontFeelingBrowseAssignmentDTO = {
  feelingSlug: string
  /** Empty string when browse applies to the whole pillar (product linked only to that feeling category). */
  subfeelingSlug: string
}

export type StorefrontMediaDTO = {
  /** Optional curated crop for product cards / PLPs. */
  card?: string | null
  gallery?: StorefrontMediaGalleryItemDTO[]
  main?: string | null
  /** Base64 data URL for Next.js `placeholder="blur"` (optional; set via `product.metadata.media`). */
  blurDataUrlMain?: string | null
  /** CSS color e.g. `#4F111F` for skeleton / theme hints. */
  dominantColorMain?: string | null
}

export type StorefrontBuyerRoute =
  | "feeling"
  | "moment"
  | "gift"
  | "personality"
  | "artist_drop"
  | "world"

export type StorefrontPrimaryAudience =
  | "25-40"
  | "18-24"
  | "gift-buyer"
  | "artist-aware"
  | "40-plus"

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

export type StorefrontReviewProofDTO = {
  id: string
  rating: number
  body: string
  locale: string
  photoUrl?: string | null
  videoUrl?: string | null
  instagramHandle?: string | null
  permissionToRepost: boolean
  fitFeedback?: string | null
  giftFeedback?: string | null
  ugcType: "review" | "photo" | "video" | "delivery_reaction"
  source: "post_delivery_whatsapp" | "website" | "manual_admin" | "instagram"
  createdAt?: string | null
}

export type StorefrontReviewsSummaryDTO = {
  count: number
  averageRating: number
}

export type StorefrontProductDTO = {
  id?: string
  apparelCategoryPath?: string
  /** Resolved for PDP: metadata.artist first, else storefront_artist by artistSlug. */
  artistDisplay?: StorefrontProductArtistDisplayDTO
  artistSlug: string
  availableSizes?: string[]
  artworkSlug?: string
  buyerRoute?: StorefrontBuyerRoute
  primaryAudience?: StorefrontPrimaryAudience
  firstWedgeEligible?: boolean
  giftable?: boolean
  giftOccasionTags?: string[]
  careInstructions?: string
  capsuleSlugs?: string[]
  complementarySlugs?: string[]
  customersAlsoBoughtSlugs?: string[]
  decorationType?: "plain" | "graphic" | "embroidered" | "mixed"
  description?: string
  /** True when the product has a non-null primary image (thumbnail / main). Used to gate catalog during launch readiness. */
  hasValidPrimaryImage: boolean
  /** Emotion/mood cues from metadata.feelsLike — e.g. ["quiet confidence", "rebel energy"]. */
  feelsLike?: string[]
  feelingSlug: string
  /** Thematic line under a feeling (emotions, zodiac, fiction, career, trends). */
  lineSlug?: string
  launchGroup?: "zodiac_capsule" | "mood" | "lifestyle"
  launchAudience?: "men" | "women" | "unisex"
  launchDesign?:
    | "gemini"
    | "cancer"
    | "leo"
    | "virgo"
    | "i-care"
    | "i-dont-care"
    | "walk-alone"
  zodiacSign?: "gemini" | "cancer" | "leo" | "virgo"
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
  /** Campaign line from `metadata.promoLabel` (hidden before starts_at / after ends_at). */
  promoLabel?: LocalizedText
  /** ISO-8601 start for the promo; admin previews may show scheduled promos before live. */
  promoStartsAt?: string
  /** ISO-8601 deadline for the promo; storefront uses this to render a live countdown. */
  promoEndsAt?: string
  /** Defaults to true when omitted. False means label and strike-through only. */
  promoShowCountdown?: boolean
  priceEgp: number
  slug: string
  stockNote?: string
  story: string
  /** Longer background for PDP 'Design Story' accordion. */
  storyDescription?: string
  thumbnail?: string | null
  /** ISO from Medusa `product.updated_at` (sitemap / freshness). */
  updatedAt?: string
  trustBadges?: string[]
  reviewsSummary?: StorefrontReviewsSummaryDTO
  reviewProof?: StorefrontReviewProofDTO[]
  /** Occasion/moment cues from metadata.worksFor — e.g. ["night out", "gift", "Eid"]. */
  worksFor?: string[]
  useCase?: string
  variantsBySize: Record<string, StorefrontVariantDTO>
  /**
   * Present when every variant has a Color option and at least two distinct colors.
   * `variantsBySize` is the default color row (first available variant’s color, else sorted first).
   */
  variantsByColor?: Record<string, StorefrontVariantDTO[]>
  wearerStories?: Array<Record<string, unknown>>
  artistStorySlides?: Array<Record<string, unknown>>
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
