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
  "lifestyle",
  "flat_lay",
  "proof_fabric",
  "proof_print",
  "proof_wash",
] as const
export type DropImageTag = (typeof DROP_IMAGE_TAGS)[number]

export const DROP_DECORATION_TYPES = ["plain", "graphic", "embroidered", "mixed"] as const
export type DropDecorationType = (typeof DROP_DECORATION_TYPES)[number]

export const DROP_STATUSES = ["draft", "published", "archived"] as const
export type DropStatus = (typeof DROP_STATUSES)[number]

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
