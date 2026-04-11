export type StorefrontVariantDTO = {
  allow_backorder: boolean
  available: boolean
  currency_code: string
  id: string
  inventory_quantity: number | null
  manage_inventory: boolean
  price_egp: number
  size: string
  sku: string | null
}

export type StorefrontMediaDTO = {
  gallery?: string[]
  main?: string | null
}

export type StorefrontArtistDTO = {
  active: boolean
  avatarSrc?: string
  designCount: number
  name: string
  slug: string
  style: string
}

export type StorefrontProductDTO = {
  apparelCategoryPath?: string
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
  pdpFitModels?: Array<Record<string, unknown>>
  primaryFeelingSlug: string
  primaryOccasionSlug?: string
  primarySubfeelingSlug: string
  priceEgp: number
  slug: string
  stockNote?: string
  story: string
  thumbnail?: string | null
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
