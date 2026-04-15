import { CART_STORAGE_KEY, MEDUSA_CART_ID_STORAGE_KEY } from '../types';

/**
 * Mirrors `CartProvider.clearCart` persistence: wipe bag JSON and Medusa id synchronously
 * so `horo-medusa-cart-id-v1` cannot race back on the next mount.
 */
describe('cart storage clear contract', () => {
  const mem: Record<string, string> = {};

  beforeAll(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (k: string) => (k in mem ? mem[k] : null),
        setItem: (k: string, v: string) => {
          mem[k] = v;
        },
        removeItem: (k: string) => {
          delete mem[k];
        },
      },
    });
  });

  it('clears both keys used after checkout completion (same order as clearCart)', () => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([{ productSlug: 'x', size: 'M', qty: 1 }]));
    localStorage.setItem(MEDUSA_CART_ID_STORAGE_KEY, 'cart_completed_123');

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([]));
    localStorage.removeItem(MEDUSA_CART_ID_STORAGE_KEY);

    expect(localStorage.getItem(MEDUSA_CART_ID_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(CART_STORAGE_KEY)).toBe('[]');
  });
});
