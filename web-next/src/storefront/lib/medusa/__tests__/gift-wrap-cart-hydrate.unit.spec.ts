import { GIFT_WRAP_PRODUCT_HANDLE, getCartGiftWrapEgp, toCartLines } from '../adapters';
import type { MedusaCart, MedusaCartLineItem } from '../types';

describe('gift wrap cart hydration', () => {
  it('derives gift wrap total from wrap line and excludes wrap from shopper cart rows', () => {
    const tee = {
      id: 'li_tee',
      variant_id: 'v_tee',
      quantity: 1,
      product_handle: 'some-tee',
      total: 500,
    } as MedusaCartLineItem;
    const wrap = {
      id: 'li_wrap',
      variant_id: 'v_wrap',
      quantity: 1,
      product_handle: GIFT_WRAP_PRODUCT_HANDLE,
      total: 120,
    } as MedusaCartLineItem;
    const cart: MedusaCart = {
      id: 'cart_1',
      currency_code: 'egp',
      items: [tee, wrap],
    };
    expect(getCartGiftWrapEgp(cart)).toBe(120);
    expect(toCartLines(cart)).toHaveLength(1);
  });
});
