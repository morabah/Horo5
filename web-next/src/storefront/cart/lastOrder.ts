import type { CartLine } from './types';

export const LAST_ORDER_STORAGE_KEY = 'horo-last-order-v1';

export type LastOrderSnapshot = {
  /** Customer-facing id, e.g. `HORO-123` when Medusa `display_id` exists. */
  orderId: string;
  lines: CartLine[];
  cartId?: string;
  /** Medusa `order.id` (ULID) for support / payment correlation — not the primary display number. */
  medusaOrderId?: string;
  subtotal: number;
  giftWrapEgp?: number;
  /** From Medusa `order.discount_total` when present (EGP, positive display amount). */
  discountEgp?: number;
  /** From Medusa `order.tax_total` when present. */
  taxEgp?: number;
  shipping: number;
  total: number;
  paymentMethod: 'cod' | 'card';
  shippingMethod: 'standard';
  paymentLabel?: string;
  shippingLabel?: string;
  estimatedDeliveryWindow?: string;
  contactEmail?: string;
  contactName?: string;
  contactPhone?: string;
  shippingLine1?: string;
  shippingCity?: string;
  whatsappOptIn?: boolean;
  /** From Medusa `order.metadata.horo_ops_handling` when set by internal ops. */
  horoOpsHandling?: 'pending' | 'received' | 'collected';
};

export function saveLastOrder(snapshot: LastOrderSnapshot): void {
  try {
    sessionStorage.setItem(LAST_ORDER_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    /* ignore */
  }
}

export function loadLastOrder(): LastOrderSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(LAST_ORDER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LastOrderSnapshot;
    if (!parsed?.orderId || !Array.isArray(parsed.lines)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** True when the snapshot was saved for this Medusa order (`order_…` ULID). */
export function sessionSnapshotBelongsToOrder(
  snapshot: LastOrderSnapshot | null | undefined,
  medusaOrderId: string | null | undefined,
): boolean {
  if (!snapshot || !medusaOrderId) return false;
  return typeof snapshot.medusaOrderId === 'string' && snapshot.medusaOrderId === medusaOrderId;
}
