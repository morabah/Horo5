import type { Product } from '../data/site';
import { getProducts } from '../data/site';

export type ProductSortKey = 'featured' | 'newest' | 'price-asc' | 'price-desc';

function catalogIndex(p: Product): number {
  const i = getProducts().findIndex((x) => x.slug === p.slug);
  return i === -1 ? 0 : i;
}

export function sortProductList(list: Product[], key: ProductSortKey): Product[] {
  const copy = [...list];
  switch (key) {
    case 'featured':
      return copy.sort((a, b) => catalogIndex(a) - catalogIndex(b));
    case 'newest':
      return copy.sort((a, b) => catalogIndex(b) - catalogIndex(a));
    case 'price-asc':
      return copy.sort((a, b) => a.priceEgp - b.priceEgp);
    case 'price-desc':
      return copy.sort((a, b) => b.priceEgp - a.priceEgp);
    default:
      return copy;
  }
}
