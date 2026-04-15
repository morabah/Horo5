const PLACED_ORDER_MEDUSA_ID_KEY = 'horo-placed-order-medusa-id-v1';

export function setPlacedOrderMedusaIdHint(medusaOrderId: string): void {
  if (typeof window === 'undefined' || !medusaOrderId.trim()) return;
  try {
    sessionStorage.setItem(PLACED_ORDER_MEDUSA_ID_KEY, medusaOrderId.trim());
  } catch {
    /* ignore */
  }
}

export function readPlacedOrderMedusaIdHint(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = sessionStorage.getItem(PLACED_ORDER_MEDUSA_ID_KEY);
    return v && v.trim().length > 0 ? v.trim() : null;
  } catch {
    return null;
  }
}

export function clearPlacedOrderMedusaIdHint(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(PLACED_ORDER_MEDUSA_ID_KEY);
  } catch {
    /* ignore */
  }
}
