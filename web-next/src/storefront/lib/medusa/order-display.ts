import type { LastOrderSnapshot } from '../../cart/lastOrder';
import { getOrderGiftWrapEgp, isGiftWrapLineItem } from './adapters';
import type { MedusaOrder } from './types';
import { medusaAmountToEgp, medusaAmountToEgpUnknown } from './egp-amount';

/** Whole EGP; Medusa snapshots are integers. */
export const ORDER_DISPLAY_EPSILON = 1;

type OrderMoneySnapshot = Pick<
  LastOrderSnapshot,
  'subtotal' | 'shipping' | 'total' | 'giftWrapEgp' | 'discountEgp' | 'taxEgp'
>;

/**
 * Sums the same monetary rows shown in `OrderConfirmation` before the final total line
 * (subtotal, optional gift/discount/tax, shipping). Used to detect API vs display drift.
 */
export function sumOrderConfirmationDisplayedComponents(order: OrderMoneySnapshot): number {
  let sum = order.subtotal + order.shipping;
  if (order.giftWrapEgp != null && order.giftWrapEgp > 0) {
    sum += order.giftWrapEgp;
  }
  if (order.discountEgp != null && order.discountEgp > 0) {
    sum -= order.discountEgp;
  }
  if (order.taxEgp != null && order.taxEgp > 0) {
    sum += order.taxEgp;
  }
  return sum;
}

/**
 * When non-zero, show an "adjustments" row so subtotal + shipping + … always reconciles to `total`.
 */
export function orderConfirmationFooterDeltaEgp(order: OrderMoneySnapshot): number | null {
  const delta = order.total - sumOrderConfirmationDisplayedComponents(order);
  if (!Number.isFinite(delta) || Math.abs(delta) <= ORDER_DISPLAY_EPSILON) {
    return null;
  }
  return delta;
}

/** Sum of `item.total` for product lines (excludes gift-wrap line). */
export function sumOrderMerchandiseLineTotalsEgp(order: MedusaOrder): number {
  let sum = 0;
  for (const item of order.items ?? []) {
    if (isGiftWrapLineItem(item)) continue;
    sum += medusaAmountToEgpUnknown(item.total as unknown);
  }
  return sum;
}

function orderSnapshotTaxEgp(order: MedusaOrder): number {
  const rawTax = order.tax_total;
  if (typeof rawTax === 'number' && rawTax > 0) return medusaAmountToEgp(rawTax);
  if (typeof rawTax === 'string' && Number(rawTax) > 0) return medusaAmountToEgp(Number(rawTax));
  return 0;
}

function orderSnapshotDiscountEgp(order: MedusaOrder): number {
  const rawDisc = order.discount_total;
  if (typeof rawDisc === 'number' && rawDisc !== 0) return medusaAmountToEgp(Math.abs(rawDisc));
  if (typeof rawDisc === 'string' && Number(rawDisc) !== 0) return medusaAmountToEgp(Math.abs(Number(rawDisc)));
  return 0;
}

/**
 * Store `order.subtotal` sometimes bundles amounts (e.g. shipping) that we show again on a
 * shipping row — then 800+800 lines + subtotal 1680 + shipping 80 misleads buyers. When the sum
 * of product line totals + gift wrap + tax − discount + shipping matches `order.total`, use that
 * line sum as the snapshot merchandise subtotal so the receipt matches logical math.
 */
export function resolveOrderSnapshotSubtotalEgp(order: MedusaOrder): number {
  const apiSubtotal = medusaAmountToEgp((order.subtotal ?? 0) || 0);
  const lineSum = sumOrderMerchandiseLineTotalsEgp(order);
  if (lineSum <= 0) return apiSubtotal;

  const shipping = medusaAmountToEgp((order.shipping_total ?? order.shipping_methods?.[0]?.amount ?? 0) || 0);
  const total = medusaAmountToEgp((order.total ?? 0) || 0);
  const giftWrap = getOrderGiftWrapEgp(order);
  const tax = orderSnapshotTaxEgp(order);
  const discount = orderSnapshotDiscountEgp(order);

  const expectedTotal = lineSum + giftWrap + tax - discount + shipping;
  if (Math.abs(expectedTotal - total) <= ORDER_DISPLAY_EPSILON) {
    return lineSum;
  }
  return apiSubtotal;
}
