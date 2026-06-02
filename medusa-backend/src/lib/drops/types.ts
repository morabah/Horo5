import {
  PRODUCT_SIZE_KEYS,
  type ProductSizeKey,
  DEFAULT_TRUST_BADGES,
} from "../shared/constants"

export const DROP_SIZE_KEYS = PRODUCT_SIZE_KEYS
export type { ProductSizeKey }

export const DEFAULT_DROP_SIZES: readonly ProductSizeKey[] = PRODUCT_SIZE_KEYS

export const DEFAULT_DROP_TRUST_BADGES = DEFAULT_TRUST_BADGES

export const DROP_IMAGE_TAGS = [
  "main",
  "card",
  "lifestyle",
  "artwork_detail",
  "back",
  "flat_lay",
  "gift",
  "proof_fabric",
  "proof_print",
  "proof_wash",
] as const
export type DropImageTag = (typeof DROP_IMAGE_TAGS)[number]

export const DROP_DECORATION_TYPES = ["plain", "graphic", "embroidered", "mixed"] as const
export type DropDecorationType = (typeof DROP_DECORATION_TYPES)[number]

export const DROP_STATUSES = ["draft", "published", "archived"] as const
export type DropStatus = (typeof DROP_STATUSES)[number]

export const DROP_ARTIST_PAYMENT_MODELS = [
  "flat_fee",
  "royalty",
  "revenue_share",
  "hybrid",
  "unknown",
] as const
export type DropArtistPaymentModel = (typeof DROP_ARTIST_PAYMENT_MODELS)[number]

export const DROP_BUYER_ROUTES = [
  "feeling",
  "moment",
  "gift",
  "personality",
  "artist_drop",
  "world",
] as const
export type DropBuyerRoute = (typeof DROP_BUYER_ROUTES)[number]

export const DROP_PRIMARY_AUDIENCES = [
  "25-40",
  "18-24",
  "gift-buyer",
  "artist-aware",
  "40-plus",
] as const
export type DropPrimaryAudience = (typeof DROP_PRIMARY_AUDIENCES)[number]

export type DropImageInput = {
  url: string
  filename?: string
  tag?: DropImageTag
  order?: number
}

export type DropImagesByTag = {
  main?: DropImageInput | null
  gallery?: DropImageInput[]
}

export type UpsertDropPayload = {
  handle: string
  title: string
  status?: DropStatus
  story?: string
  description?: string
  feeling?: string
  subfeeling?: string
  occasions?: string[]
  apparelCategory?: string
  priceEgp?: number
  originalPriceEgp?: number | null
  sizes?: ProductSizeKey[]
  garmentColor?: string
  artist?: string
  decorationType?: DropDecorationType
  fitLabel?: string
  trustBadges?: string[]
  merchandisingBadge?: string
  stockNote?: string
  sizeTableKey?: string
  hasLifestyleImage?: boolean
  hasFlatLayImage?: boolean
  hasProofFabricImage?: boolean
  hasProofPrintImage?: boolean
  hasProofWashImage?: boolean
  samplePrintApproved?: boolean
  productPhotosApproved?: boolean
  artistRightsApproved?: boolean
  artistCreditApproved?: boolean
  usageScope?: string | null
  artistPaymentModel?: DropArtistPaymentModel
  conceptApprovedAt?: string
  sketchApprovedAt?: string
  mockupApprovedAt?: string
  printReadyApprovedAt?: string
  samplePrintApprovedAt?: string
  buyerRoute?: DropBuyerRoute
  primaryAudience?: DropPrimaryAudience
  firstWedgeEligible?: boolean
  giftable?: boolean
  giftOccasionTags?: string[]
  giftTrustCopy?: string | null
  images?: DropImageInput[]
  imagesByTag?: DropImagesByTag
  stockPerSize?: Partial<Record<ProductSizeKey, number>>
  capsuleSlugs?: string[]
  complementarySlugs?: string[]
  frequentlyBoughtWithSlugs?: string[]
  customersAlsoBoughtSlugs?: string[]
  launchAt?: string
  sunsetAt?: string
}

export type DropValidationIssue = {
  field: string
  message: string
}

export type UpsertDropResult = {
  id: string
  handle: string
  status: DropStatus
  created: boolean
}

export type DropUploadFileInput = {
  filename: string
  mimeType: string
  content: string
}

export type DropUploadedFile = {
  url: string
  filename: string
}
