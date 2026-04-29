import type { Product, ProductSizeKey, ProductVariantRecord } from '../data/site';
import { findProductVariantById } from './productVariants';

export type ProductStockLimit = number | null;

export function getVariantStockLimit(variant: ProductVariantRecord | null | undefined): ProductStockLimit {
  if (!variant) return null;
  if (!variant.available) return 0;
  if (!variant.manageInventory || variant.allowBackorder) return null;

  const qty = variant.inventoryQuantity;
  if (typeof qty !== 'number' || !Number.isFinite(qty)) return null;
  return Math.max(0, Math.floor(qty));
}

export function getProductVariantForSelection(
  product: Product | null | undefined,
  size: ProductSizeKey,
  explicitVariantId?: string | null,
): ProductVariantRecord | undefined {
  if (!product) return undefined;
  return explicitVariantId
    ? findProductVariantById(product, explicitVariantId)
    : product.variantsBySize?.[size];
}

export function getProductSizeStockLimit(
  product: Product | null | undefined,
  size: ProductSizeKey,
  explicitVariantId?: string | null,
): ProductStockLimit {
  return getVariantStockLimit(getProductVariantForSelection(product, size, explicitVariantId));
}

export function productVariantCanBeSelected(variant: ProductVariantRecord | null | undefined): boolean {
  if (!variant) return false;
  const limit = getVariantStockLimit(variant);
  return limit === null || limit > 0;
}
