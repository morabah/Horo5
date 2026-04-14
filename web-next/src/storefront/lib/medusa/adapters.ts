import type { Product, ProductSizeKey } from "../../data/site"
import type { CartLine } from "../../cart/types"
import type {
  MedusaCart,
  MedusaCartLineItem,
  MedusaOrder,
  MedusaProduct,
  MedusaProductVariant,
} from "./types"
import { medusaAmountToEgp } from "./egp-amount"

const DEFAULT_SIZE: ProductSizeKey = "M"
export const GIFT_WRAP_PRODUCT_HANDLE = "gift-wrap"

export function getVariantSize(variant: MedusaProductVariant): ProductSizeKey {
  const raw =
    variant.options?.find(
      (opt) => (opt.option?.title || "").toLowerCase() === "size"
    )?.value ?? variant.title
  const normalized = String(raw || "").toUpperCase()

  if (
    normalized === "S" ||
    normalized === "M" ||
    normalized === "L" ||
    normalized === "XL" ||
    normalized === "XXL"
  ) {
    return normalized
  }

  return DEFAULT_SIZE
}

export function isHiddenCatalogProduct(product: Pick<MedusaProduct, "metadata">) {
  return product.metadata?.hidden === true || product.metadata?.hidden === "true"
}

export function isGiftWrapHandle(handle?: string | null) {
  return (handle || "").toLowerCase() === GIFT_WRAP_PRODUCT_HANDLE
}

export function isGiftWrapLineItem(item: Pick<MedusaCartLineItem, "product_handle">) {
  return isGiftWrapHandle(item.product_handle)
}

export function toProduct(medusa: MedusaProduct): Product {
  const variantSizes = (medusa.variants || []).map(getVariantSize)
  const availableSizes = Array.from(new Set(variantSizes))
  const calculatedPrice = medusa.variants?.[0]?.calculated_price?.calculated_amount
  const fallbackPrice = medusa.variants?.[0]?.prices?.find(
    (p) => p.currency_code.toLowerCase() === "egp"
  )?.amount
  const metadata = medusa.metadata || {}
  const metadataAvailableSizes = Array.isArray(metadata.availableSizes)
    ? metadata.availableSizes.filter((value): value is ProductSizeKey => {
        return value === "S" || value === "M" || value === "L" || value === "XL" || value === "XXL"
      })
    : []
  const primaryFeelingSlug =
    typeof metadata.primaryFeelingSlug === "string" ? metadata.primaryFeelingSlug : undefined
  const feelingSlug =
    primaryFeelingSlug ||
    (typeof metadata.feelingSlug === "string" ? metadata.feelingSlug : "")
  const artistSlug =
    typeof metadata.artistSlug === "string" ? metadata.artistSlug : ""
  const occasionSlugs = Array.isArray(metadata.occasionSlugs)
    ? (metadata.occasionSlugs.filter((value): value is string => typeof value === "string") as Product["occasionSlugs"])
    : []
  const gallery = (medusa.images || [])
    .map((image) => image.url)
    .filter((value): value is string => Boolean(value))
  const thumbnail = medusa.thumbnail || gallery[0] || null
  const trustBadges = Array.isArray(metadata.trustBadges)
    ? metadata.trustBadges.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    : []

  return {
    slug: medusa.handle,
    name: medusa.title,
    artistSlug,
    primaryFeelingSlug,
    feelingSlug,
    occasionSlugs,
    priceEgp: medusaAmountToEgp((calculatedPrice ?? fallbackPrice ?? 0) as number),
    story:
      (typeof metadata.story === "string" && metadata.story) ||
      medusa.description ||
      "",
    availableSizes:
      availableSizes.length > 0
        ? availableSizes
        : metadataAvailableSizes.length > 0
          ? metadataAvailableSizes
          : undefined,
    description: medusa.description || undefined,
    fitLabel: typeof metadata.fitLabel === "string" ? metadata.fitLabel : undefined,
    merchandisingBadge:
      typeof metadata.merchandisingBadge === "string" ? metadata.merchandisingBadge : undefined,
    stockNote: typeof metadata.stockNote === "string" ? metadata.stockNote : undefined,
    thumbnail,
    media:
      thumbnail || gallery.length > 0
        ? {
            gallery: gallery.length > 0 ? gallery : undefined,
            main: thumbnail,
          }
        : undefined,
    trustBadges: trustBadges.length > 0 ? trustBadges : undefined,
    useCase: typeof metadata.useCase === "string" ? metadata.useCase : undefined,
  }
}

export function toCatalog(products: MedusaProduct[]): Product[] {
  return products.filter((product) => !isHiddenCatalogProduct(product)).map(toProduct)
}

function toCartLine(item: MedusaCartLineItem): CartLine {
  const size = (
    item.variant_title?.split(" / ")[0] ||
    item.variant_title ||
    "M"
  ).toUpperCase() as ProductSizeKey

  return {
    imageSrc: item.thumbnail || undefined,
    lineId: item.id,
    productName: item.product_title || item.title || item.product?.title,
    productSlug: item.product_handle || item.variant_id,
    qty: item.quantity,
    size:
      size === "S" ||
      size === "M" ||
      size === "L" ||
      size === "XL" ||
      size === "XXL"
        ? size
        : "M",
    unitPriceEgp:
      typeof item.unit_price === "number" ? medusaAmountToEgp(item.unit_price) : undefined,
    variantId: item.variant_id,
  }
}

export function toCartLines(cart: MedusaCart): CartLine[] {
  return (cart.items || [])
    .filter((item) => !isGiftWrapLineItem(item))
    .map(toCartLine)
}

export function getCartGiftWrapEgp(cart: MedusaCart): number {
  const giftWrapLine = (cart.items || []).find(isGiftWrapLineItem)

  if (!giftWrapLine) {
    return 0
  }

  const total = typeof giftWrapLine.total === "number" ? giftWrapLine.total : undefined
  const unitPrice =
    typeof giftWrapLine.unit_price === "number" ? giftWrapLine.unit_price : undefined

  if (typeof total === "number") {
    return medusaAmountToEgp(total)
  }

  if (typeof unitPrice === "number") {
    return medusaAmountToEgp(unitPrice * giftWrapLine.quantity)
  }

  return 0
}

export function getGiftWrapLineItem(cart: Pick<MedusaCart, "items">) {
  return (cart.items || []).find(isGiftWrapLineItem) || null
}

export function getOrderGiftWrapEgp(order: MedusaOrder): number {
  const giftWrapLine = (order.items || []).find(isGiftWrapLineItem)

  if (!giftWrapLine) {
    return 0
  }

  const total = typeof giftWrapLine.total === "number" ? giftWrapLine.total : undefined
  const unitPrice =
    typeof giftWrapLine.unit_price === "number" ? giftWrapLine.unit_price : undefined

  if (typeof total === "number") {
    return medusaAmountToEgp(total)
  }

  if (typeof unitPrice === "number") {
    return medusaAmountToEgp(unitPrice * giftWrapLine.quantity)
  }

  return 0
}

export function toOrderLines(order: MedusaOrder): CartLine[] {
  return (order.items || [])
    .filter((item) => !isGiftWrapLineItem(item))
    .map(toCartLine)
}
