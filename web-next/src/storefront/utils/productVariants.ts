import type { Product, ProductVariantRecord } from '../data/site';

export function findProductVariantById(product: Product, id: string): ProductVariantRecord | undefined {
  if (product.variantsByColor) {
    for (const row of Object.values(product.variantsByColor)) {
      const hit = row.find((v) => v.id === id);
      if (hit) return hit;
    }
  }
  return Object.values(product.variantsBySize || {}).find((v) => v && v.id === id) as ProductVariantRecord | undefined;
}
