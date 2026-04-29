import type { MedusaCart, MedusaCartLineItem } from '../lib/medusa/types';
import type { CartLineIdentity } from './types';

function medusaLineAmount(item: MedusaCartLineItem): number {
  if (typeof item.total === 'number' && item.total >= 0) return item.total;
  if (typeof item.unit_price === 'number' && item.unit_price >= 0) {
    return item.unit_price * Math.max(1, item.quantity || 1);
  }
  return 0;
}

function medusaLineUnitAmount(item: MedusaCartLineItem): number {
  if (typeof item.unit_price === 'number' && item.unit_price >= 0) return item.unit_price;
  const qty = Math.max(1, item.quantity || 1);
  const total = medusaLineAmount(item);
  return total > 0 ? Math.round(total / qty) : 0;
}

function medusaLineMatchesIdentity(item: MedusaCartLineItem, identity: CartLineIdentity): boolean {
  if (identity.lineId) return item.id === identity.lineId;
  if (identity.variantId) return item.variant_id === identity.variantId;
  return (item.product_handle || item.variant_id) === identity.productSlug;
}

function medusaLineMatchesPreviousItem(item: MedusaCartLineItem, previous: MedusaCartLineItem): boolean {
  if (item.id && previous.id) return item.id === previous.id;
  if (item.variant_id && previous.variant_id) return item.variant_id === previous.variant_id;
  return (item.product_handle || item.variant_id) === (previous.product_handle || previous.variant_id);
}

function adjustAmount(value: number | undefined, delta: number): number | undefined {
  return typeof value === 'number' ? Math.max(0, value + delta) : value;
}

/** Preserve visible checkout row order when Medusa returns cart items in a different order. */
export function orderMedusaCartItemsByPreviousOrder(
  cart: MedusaCart,
  previousCart: MedusaCart | null | undefined,
): MedusaCart {
  if (!previousCart || cart.items.length < 2 || previousCart.items.length === 0) return cart;

  const usedIndexes = new Set<number>();
  const ordered: MedusaCartLineItem[] = [];

  for (const previous of previousCart.items) {
    const nextIndex = cart.items.findIndex((item, index) => {
      return !usedIndexes.has(index) && medusaLineMatchesPreviousItem(item, previous);
    });
    if (nextIndex < 0) continue;
    usedIndexes.add(nextIndex);
    ordered.push(cart.items[nextIndex]);
  }

  cart.items.forEach((item, index) => {
    if (!usedIndexes.has(index)) {
      ordered.push(item);
    }
  });

  return {
    ...cart,
    items: ordered,
  };
}

export function updateMedusaCartLineQtyOptimistically(
  cart: MedusaCart,
  identity: CartLineIdentity,
  qty: number,
): MedusaCart {
  const index = cart.items.findIndex((item) => medusaLineMatchesIdentity(item, identity));
  if (index < 0) return cart;

  const current = cart.items[index];
  const previousLineTotal = medusaLineAmount(current);
  const nextItems = [...cart.items];
  let nextLineTotal = 0;

  if (qty < 1) {
    nextItems.splice(index, 1);
  } else {
    const unitAmount = medusaLineUnitAmount(current);
    nextLineTotal = unitAmount * qty;
    nextItems[index] = {
      ...current,
      quantity: qty,
      total: nextLineTotal,
    };
  }

  const delta = nextLineTotal - previousLineTotal;

  return {
    ...cart,
    items: nextItems,
    subtotal: adjustAmount(cart.subtotal, delta),
    total: adjustAmount(cart.total, delta),
  };
}
