import { PDP_SCHEMA } from '../data/domain-config';
import type { Product, ProductSizeKey } from '../data/site';

export function defaultCatalogSizeKeys(): ProductSizeKey[] {
  return PDP_SCHEMA.sizes
    .filter((s) => !('disabled' in s && s.disabled))
    .map((s) => s.key as ProductSizeKey);
}

export function productAvailableSizes(product: Product): ProductSizeKey[] {
  const base = defaultCatalogSizeKeys();
  const variantEntries = Object.entries(product.variantsBySize || {}) as Array<
    [ProductSizeKey, NonNullable<Product['variantsBySize']>[ProductSizeKey]]
  >;

  if (variantEntries.length > 0) {
    const available = new Set(
      variantEntries
        .filter(([, variant]) => Boolean(variant?.available))
        .map(([size]) => size),
    );
    return base.filter((key) => available.has(key));
  }

  if (!product.availableSizes?.length) return base;
  const allow = new Set(product.availableSizes);
  return base.filter((k) => allow.has(k));
}

export function productHasCatalogSize(product: Product, size: ProductSizeKey): boolean {
  return productAvailableSizes(product).includes(size);
}
