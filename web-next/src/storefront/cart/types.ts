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
export const MEDUSA_CART_ID_COOKIE = 'horo_cart_id';

export type CartLineIdentity = Pick<CartLine, 'productSlug' | 'size'> &
  Partial<Pick<CartLine, 'lineId' | 'variantId'>>;

export function cartLineKey(line: Pick<CartLine, 'productSlug' | 'size' | 'variantId'>): string {
  if (line.variantId) {
    return `${line.productSlug}::${line.size}::${line.variantId}`;
  }
  return `${line.productSlug}::${line.size}`;
}

export function cartLineIdentityKey(line: CartLineIdentity): string {
  return line.lineId ? `line:${line.lineId}` : `catalog:${cartLineKey(line)}`;
}

export function cartLineViewKey(line: CartLineIdentity): string {
  return line.lineId ? `${cartLineKey(line)}::${line.lineId}` : cartLineKey(line);
}

export function findCartLineIndex(lines: CartLine[], identity: CartLineIdentity): number {
  if (identity.lineId) {
    const lineIdIndex = lines.findIndex((line) => line.lineId === identity.lineId);
    if (lineIdIndex >= 0) return lineIdIndex;
  }

  const key = cartLineKey(identity);
  return lines.findIndex((line) => cartLineKey(line) === key);
}

export function findMergeableCartLineIndex(lines: CartLine[], identity: CartLineIdentity): number {
  const exactIndex = findCartLineIndex(lines, identity);
  if (exactIndex >= 0) return exactIndex;

  if (!identity.variantId) return -1;

  return lines.findIndex(
    (line) =>
      line.productSlug === identity.productSlug &&
      line.size === identity.size &&
      !line.variantId,
  );
}

function cartLineMatchesPreviousIdentity(line: CartLine, previous: CartLineIdentity): boolean {
  if (line.lineId && previous.lineId) {
    return line.lineId === previous.lineId;
  }

  return cartLineKey(line) === cartLineKey(previous);
}

/** Preserve visible row order when Medusa returns the same cart lines in a different order. */
export function orderCartLinesByPreviousOrder(lines: CartLine[], previousLines: CartLine[]): CartLine[] {
  if (lines.length < 2 || previousLines.length === 0) return lines;

  const usedIndexes = new Set<number>();
  const ordered: CartLine[] = [];

  for (const previous of previousLines) {
    const nextIndex = lines.findIndex((line, index) => {
      return !usedIndexes.has(index) && cartLineMatchesPreviousIdentity(line, previous);
    });
    if (nextIndex < 0) continue;
    usedIndexes.add(nextIndex);
    ordered.push(lines[nextIndex]);
  }

  lines.forEach((line, index) => {
    if (!usedIndexes.has(index)) {
      ordered.push(line);
    }
  });

  return ordered;
}

export function cartLineWithQty(line: CartLine, qty: number): CartLine {
  const next: CartLine = { ...line, qty };
  if (typeof line.unitPriceEgp === 'number') {
    next.medusaLineTotalEgp = line.unitPriceEgp * qty;
  } else {
    delete next.medusaLineTotalEgp;
  }
  return next;
}

export function updateCartLineQty(lines: CartLine[], identity: CartLineIdentity, qty: number): CartLine[] {
  const index = findCartLineIndex(lines, identity);
  if (index < 0) return lines;

  if (qty < 1) {
    return lines.filter((_, i) => i !== index);
  }

  return lines.map((line, i) => (i === index ? cartLineWithQty(line, qty) : line));
}

export function removeCartLine(lines: CartLine[], identity: CartLineIdentity): CartLine[] {
  const index = findCartLineIndex(lines, identity);
  if (index < 0) return lines;
  return lines.filter((_, i) => i !== index);
}
