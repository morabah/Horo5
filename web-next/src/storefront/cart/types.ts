import type { ProductSizeKey } from '../data/site';

export type CartLine = {
  productSlug: string;
  size: ProductSizeKey;
  qty: number;
  lineId?: string;
  variantId?: string;
  productName?: string;
  imageSrc?: string;
  unitPriceEgp?: number;
  /** When set (e.g. from Medusa line `total`), drives display totals so rows match order.subtotal/total. */
  medusaLineTotalEgp?: number;
};

export const CART_STORAGE_KEY = 'horo-cart-v1';
export const MEDUSA_CART_ID_STORAGE_KEY = 'horo-medusa-cart-id-v1';

export function cartLineKey(line: Pick<CartLine, 'productSlug' | 'size'>): string {
  return `${line.productSlug}::${line.size}`;
}
