import { persistCartIdCookie, readCartIdFromCookieString } from './cart-cookie';
import { MEDUSA_CART_ID_STORAGE_KEY } from './types';

/** Single source of truth for reading the active Medusa cart id from the browser. */
export function loadMedusaCartId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const localCartId = window.localStorage.getItem(MEDUSA_CART_ID_STORAGE_KEY);
    if (localCartId) return localCartId;
  } catch {
    /* fall through to cookie */
  }
  if (typeof document === 'undefined') return null;
  return readCartIdFromCookieString(document.cookie);
}

/** Single source of truth for persisting (or clearing) the active Medusa cart id. */
export function persistMedusaCartId(cartId: string | null): void {
  if (typeof window === 'undefined') return;
  persistCartIdCookie(cartId);
  try {
    if (!cartId) {
      window.localStorage.removeItem(MEDUSA_CART_ID_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(MEDUSA_CART_ID_STORAGE_KEY, cartId);
  } catch {
    /* ignore */
  }
}
