import type { Product, ProductSizeKey } from "../../data/site"
import type { CartLine } from "../../cart/types"
import type {
  MedusaCart,
  MedusaCartLineItem,
  MedusaOrder,
  MedusaProduct,
  MedusaProductVariant,
} from "./types"

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
  const inferredFeeling =
    medusa.handle.includes("emotion")
      ? "soft-quiet"
      : medusa.handle.includes("zodiac")
        ? "warm-romantic"
        : medusa.handle.includes("fiction")
          ? "playful-offbeat"
          : medusa.handle.includes("career")
            ? "grounded-everyday"
            : "bold-electric"
  const feelingSlug =
    typeof metadata.feelingSlug === "string" ? metadata.feelingSlug : inferredFeeling
  const artistSlug =
    typeof metadata.artistSlug === "string" ? metadata.artistSlug : "nada-ibrahim"
  const occasionSlugs = Array.isArray(metadata.occasionSlugs)
    ? (metadata.occasionSlugs.filter((value): value is string => typeof value === "string") as Product["occasionSlugs"])
    : ["just-because"]

  return {
    slug: medusa.handle,
    name: medusa.title,
    artistSlug,
    feelingSlug,
    occasionSlugs,
    priceEgp: Math.round(((calculatedPrice ?? fallbackPrice ?? 79900) as number) / 100),
    story:
      (typeof metadata.descriptionEn === "string" && metadata.descriptionEn) ||
      medusa.description ||
      "Artist-made graphic tee.",
    availableSizes: availableSizes.length ? availableSizes : ["S", "M", "L", "XL", "XXL"],
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
      typeof item.unit_price === "number"
        ? Math.round(item.unit_price / 100)
        : undefined,
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
    return Math.round(total / 100)
  }

  if (typeof unitPrice === "number") {
    return Math.round((unitPrice * giftWrapLine.quantity) / 100)
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
    return Math.round(total / 100)
  }

  if (typeof unitPrice === "number") {
    return Math.round((unitPrice * giftWrapLine.quantity) / 100)
  }

  return 0
}

export function toOrderLines(order: MedusaOrder): CartLine[] {
  return (order.items || [])
    .filter((item) => !isGiftWrapLineItem(item))
    .map(toCartLine)
}
