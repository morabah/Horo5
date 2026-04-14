import type { CartLine } from './types';

export const LAST_ORDER_STORAGE_KEY = 'horo-last-order-v1';

export type LastOrderSnapshot = {
  orderId: string;
  lines: CartLine[];
  cartId?: string;
  medusaOrderId?: string;
  subtotal: number;
  giftWrapEgp?: number;
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
