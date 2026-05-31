/**
 * Shared business constants extracted from hard-coded literals across scripts,
 * services, and storefront helpers.  Centralising here makes it trivial to
 * change a value in one place, and opens the door to later overriding them via
 * `store.metadata` or environment variables.
 */

/** Product handle for the gift-wrap add-on SKU. */
export const GIFT_WRAP_HANDLE = "gift-wrap"

/** Canonical size keys for HORO apparel variants. */
export const PRODUCT_SIZE_KEYS = ["S", "M", "L", "XL", "XXL"] as const

/** Set variant for fast `has()` lookups. */
export const PRODUCT_SIZE_SET = new Set<string>(PRODUCT_SIZE_KEYS)

/** Type-safe size literal. */
export type ProductSizeKey = (typeof PRODUCT_SIZE_KEYS)[number]

/** Default store currency. */
export const STORE_CURRENCY_CODE = "egp"

/** Default apparel category path used when a product has no explicit category. */
export const DEFAULT_APPAREL_CATEGORY_PATH = "apparel/tops/t-shirts"

/** Default trust badges injected onto products that do not define their own. */
export const DEFAULT_TRUST_BADGES = [
  "premium cotton",
  "Free exchange 14d",
  "Payment options at checkout",
] as const

/** Default per-variant stock quantity used by inventory backfill scripts. */
export const DEFAULT_STOCK_QTY = 50

/** Free-shipping promotion code prefix. */
export const FREE_SHIPPING_CODE_PREFIX = "HORO_FREE_SHIPPING"

/** Default free-shipping threshold in EGP. */
export const DEFAULT_FREE_SHIPPING_THRESHOLD_EGP = 1500

/** Bundle promotion code prefix. */
export const BUNDLE_CODE_PREFIX = "HORO_BUNDLE"
