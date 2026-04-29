import { MEDUSA_CART_ID_COOKIE } from './types';

export const CART_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function shouldUseSecureCookie(): boolean {
  if (typeof window === 'undefined') return process.env.NODE_ENV === 'production';
  return window.location.protocol === 'https:' || process.env.NODE_ENV === 'production';
}

export function readCartIdFromCookieString(cookieHeader: string | null | undefined): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const [rawKey, ...rawValue] = part.trim().split('=');
    if (rawKey !== MEDUSA_CART_ID_COOKIE) continue;
    const value = rawValue.join('=').trim();
    if (!value) return null;
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }
  return null;
}

export function buildCartCookieValue(cartId: string | null, secure = shouldUseSecureCookie()): string {
  const attrs = [
    `${MEDUSA_CART_ID_COOKIE}=${cartId ? encodeURIComponent(cartId) : ''}`,
    'Path=/',
    'SameSite=Lax',
    `Max-Age=${cartId ? CART_COOKIE_MAX_AGE_SECONDS : 0}`,
  ];
  if (secure) attrs.push('Secure');
  return attrs.join('; ');
}

export function persistCartIdCookie(cartId: string | null): void {
  if (typeof document === 'undefined') return;
  document.cookie = buildCartCookieValue(cartId);
}
