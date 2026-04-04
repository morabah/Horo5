import { PDP_SCHEMA } from '../data/domain-config';
import type { Product, ProductSizeKey } from '../data/site';

export function defaultCatalogSizeKeys(): ProductSizeKey[] {
  return PDP_SCHEMA.sizes
    .filter((s) => !('disabled' in s && s.disabled))
    .map((s) => s.key as ProductSizeKey);
}

export function productAvailableSizes(product: Product): ProductSizeKey[] {
  const base = defaultCatalogSizeKeys();
  if (!product.availableSizes?.length) return base;
  const allow = new Set(product.availableSizes);
  return base.filter((k) => allow.has(k));
}

export function productHasCatalogSize(product: Product, size: ProductSizeKey): boolean {
  return productAvailableSizes(product).includes(size);
}
