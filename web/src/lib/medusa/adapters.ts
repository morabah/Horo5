import type { Product, ProductSizeKey } from "../../data/site"
import type { CartLine } from "../../cart/types"
import type { MedusaCart, MedusaProduct, MedusaProductVariant } from "./types"

const DEFAULT_SIZE: ProductSizeKey = "M"

export function getVariantSize(variant: MedusaProductVariant): ProductSizeKey {
  const raw = variant.options?.find((opt) => (opt.option?.title || "").toLowerCase() === "size")?.value ?? variant.title
  const normalized = String(raw || "").toUpperCase()
  if (normalized === "S" || normalized === "M" || normalized === "L" || normalized === "XL" || normalized === "XXL") {
    return normalized
  }
  return DEFAULT_SIZE
}

export function toProduct(medusa: MedusaProduct): Product {
  const variantSizes = (medusa.variants || []).map(getVariantSize)
  const availableSizes = Array.from(new Set(variantSizes))
  const calculatedPrice = medusa.variants?.[0]?.calculated_price?.calculated_amount
  const fallbackPrice = medusa.variants?.[0]?.prices?.find((p) => p.currency_code.toLowerCase() === "egp")?.amount
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
  const feelingSlug = typeof metadata.feelingSlug === "string" ? metadata.feelingSlug : inferredFeeling
  const artistSlug = typeof metadata.artistSlug === "string" ? metadata.artistSlug : "nada-ibrahim"
  const occasionSlugs = Array.isArray(metadata.occasionSlugs)
    ? (metadata.occasionSlugs.filter((v): v is string => typeof v === "string") as Product["occasionSlugs"])
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
  return products.map(toProduct)
}

export function toCartLines(cart: MedusaCart): CartLine[] {
  return cart.items.map((item) => {
    const size = (item.variant_title?.split(" / ")[0] || item.variant_title || "M").toUpperCase() as ProductSizeKey
    return {
      productSlug: item.product_handle || item.variant_id,
      size: size === "S" || size === "M" || size === "L" || size === "XL" || size === "XXL" ? size : "M",
      qty: item.quantity,
      lineId: item.id,
      variantId: item.variant_id,
      productName: item.product_title || item.title,
      imageSrc: item.thumbnail || undefined,
      unitPriceEgp: typeof item.unit_price === "number" ? Math.round(item.unit_price / 100) : undefined,
    }
  })
}
