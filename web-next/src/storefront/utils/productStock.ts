import type { Product, ProductSizeKey, ProductVariantRecord, StockStatusKey } from '../data/site';
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

/**
 * Derive an overall stock status for a product from per-size statuses.
 * Priority: in_stock > low_stock > preorder > sold_out.
 */
export function deriveProductStockStatus(product: Product | null | undefined): StockStatusKey | null {
  if (!product) return null;
  const statuses = Object.values(product.stockStatusBySize ?? {});
  if (statuses.length === 0) return null;
  if (statuses.some((s) => s === 'in_stock')) return 'in_stock';
  if (statuses.some((s) => s === 'low_stock')) return 'low_stock';
  if (statuses.some((s) => s === 'preorder')) return 'preorder';
  return 'sold_out';
}
