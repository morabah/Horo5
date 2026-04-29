import {
  CART_COOKIE_MAX_AGE_SECONDS,
  buildCartCookieValue,
  readCartIdFromCookieString,
} from '../cart-cookie';
import { MEDUSA_CART_ID_COOKIE } from '../types';

describe('cart id cookie contract', () => {
  it('serializes the cart id with storefront-safe attributes', () => {
    const cookie = buildCartCookieValue('cart_123', true);

    expect(cookie).toContain(`${MEDUSA_CART_ID_COOKIE}=cart_123`);
    expect(cookie).toContain('Path=/');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain(`Max-Age=${CART_COOKIE_MAX_AGE_SECONDS}`);
    expect(cookie).toContain('Secure');
  });

  it('serializes clearing as a zero max-age cookie', () => {
    expect(buildCartCookieValue(null, false)).toBe(`${MEDUSA_CART_ID_COOKIE}=; Path=/; SameSite=Lax; Max-Age=0`);
  });

  it('reads the cart id from a cookie header', () => {
    expect(readCartIdFromCookieString(`theme=light; ${MEDUSA_CART_ID_COOKIE}=cart_abc%20123; x=y`)).toBe(
      'cart_abc 123',
    );
    expect(readCartIdFromCookieString('theme=light')).toBeNull();
  });
});
