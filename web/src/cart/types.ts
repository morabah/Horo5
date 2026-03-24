import type { ProductSizeKey } from '../data/site';

export type CartLine = {
  productSlug: string;
  size: ProductSizeKey;
  qty: number;
};

export const CART_STORAGE_KEY = 'horo-cart-v1';

export function cartLineKey(line: Pick<CartLine, 'productSlug' | 'size'>): string {
  return `${line.productSlug}::${line.size}`;
}
