export const DROP_SIZE_KEYS = ["S", "M", "L", "XL", "XXL"] as const
export type ProductSizeKey = (typeof DROP_SIZE_KEYS)[number]

export const DEFAULT_DROP_SIZES: readonly ProductSizeKey[] = DROP_SIZE_KEYS

export const DEFAULT_DROP_TRUST_BADGES = [
  "premium cotton",
  "Free exchange 14d",
  "COD available",
] as const

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
