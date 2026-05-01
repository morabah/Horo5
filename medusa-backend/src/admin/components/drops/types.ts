import { DEFAULT_TRUST_BADGES } from "../../../lib/shared/constants"

export type DropStatus = "draft" | "published" | "archived"
export type ProductSizeKey = "S" | "M" | "L" | "XL" | "XXL"
export const DROP_SIZE_KEYS: readonly ProductSizeKey[] = ["S", "M", "L", "XL", "XXL"]
export const DEFAULT_DROP_TRUST_BADGES = DEFAULT_TRUST_BADGES
export type DropImageTag = "main" | "lifestyle" | "flat_lay" | "proof_fabric" | "proof_print" | "proof_wash"

export type DropImage = {
  url: string
  filename?: string
  tag?: DropImageTag
  order?: number
}

export type DropPayload = {
  id?: string
  handle: string
  title: string
  status: DropStatus
  story?: string
  description?: string
  feeling?: string
  subfeeling?: string
  occasions?: string[]
  apparelCategory?: string
  priceEgp?: number
  originalPriceEgp?: number | null
  sizes?: ProductSizeKey[]
  stockPerSize?: Partial<Record<ProductSizeKey, number>>
  garmentColor?: string
  artist?: string
  decorationType?: "plain" | "graphic" | "embroidered" | "mixed"
  fitLabel?: string
  trustBadges?: string[]
  merchandisingBadge?: string
  stockNote?: string
  sizeTableKey?: string
  images?: DropImage[]
  capsuleSlugs?: string[]
  complementarySlugs?: string[]
  frequentlyBoughtWithSlugs?: string[]
  customersAlsoBoughtSlugs?: string[]
  launchAt?: string
  sunsetAt?: string
  updatedAt?: string | null
}

export type DropSummary = {
  id: string
  title: string
  handle: string
  status: DropStatus
  thumbnail?: string | null
  feeling?: string
  occasionSlugs?: string[]
  priceEgp?: number | null
  updatedAt?: string | null
  variantCount?: number
  totalStock?: number | null
}

export type DropLookups = {
  feelings: Array<{ id: string; slug: string; name: string; accent?: string }>
  subfeelings: Array<{ id: string; slug: string; name: string; feelingSlug: string }>
  occasions: Array<{ slug: string; name: string; active?: boolean }>
  artists: Array<{ id: string; slug: string; name: string; active?: boolean }>
  apparelCategories: Array<{ id: string; name: string; handle: string; path: string; depth: number }>
  sizeTables: string[]
  defaultSizeTableKey?: string | null
  decorationTypes: Array<"plain" | "graphic" | "embroidered" | "mixed">
  fitLabels: string[]
  sizes: ProductSizeKey[]
  storefrontUrl?: string | null
}

export type ValidationIssue = {
  field: string
  message: string
}

export type UploadedFile = {
  url: string
  filename: string
}
