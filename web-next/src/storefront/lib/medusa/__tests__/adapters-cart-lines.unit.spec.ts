/**
 * Tests for toCartLines and toCartLine adapter — ensures Medusa server
 * responses are correctly mapped to CartLine[] with proper line isolation.
 */
import { toCartLines, getCartGiftWrapEgp, getGiftWrapLineItem, GIFT_WRAP_PRODUCT_HANDLE } from '../adapters';
import type { MedusaCart, MedusaCartLineItem } from '../types';

function makeItem(overrides: Partial<MedusaCartLineItem> & Pick<MedusaCartLineItem, 'id' | 'variant_id' | 'quantity'>): MedusaCartLineItem {
  return {
    product_handle: 'test-product',
    product_title: 'Test Product',
    variant_title: 'M',
    unit_price: 100,
    total: 100 * (overrides.quantity || 1),
    ...overrides,
  } as MedusaCartLineItem;
}

function makeCart(items: MedusaCartLineItem[]): MedusaCart {
  return {
    id: 'cart_test',
    currency_code: 'egp',
    subtotal: items.reduce((sum, item) => sum + (typeof item.total === 'number' ? item.total : 0), 0),
    total: items.reduce((sum, item) => sum + (typeof item.total === 'number' ? item.total : 0), 0),
    items,
  };
}

describe('toCartLines', () => {
  it('maps Medusa cart items to CartLine[] with correct properties', () => {
    const cart = makeCart([
      makeItem({ id: 'line_1', variant_id: 'var_1', quantity: 2, product_handle: 'signal-line', variant_title: 'M', unit_price: 100, total: 200 }),
    ]);

    const lines = toCartLines(cart);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      productSlug: 'signal-line',
      size: 'M',
      qty: 2,
      lineId: 'line_1',
      variantId: 'var_1',
      unitPriceEgp: 100,
      medusaLineTotalEgp: 200,
    });
  });

  it('maps multiple items with correct isolation', () => {
    const cart = makeCart([
      makeItem({ id: 'line_a', variant_id: 'var_a', quantity: 1, product_handle: 'prod-a', variant_title: 'M', unit_price: 100, total: 100 }),
      makeItem({ id: 'line_b', variant_id: 'var_b', quantity: 3, product_handle: 'prod-b', variant_title: 'L', unit_price: 120, total: 360 }),
    ]);

    const lines = toCartLines(cart);
    expect(lines).toHaveLength(2);

    expect(lines[0].productSlug).toBe('prod-a');
    expect(lines[0].qty).toBe(1);
    expect(lines[0].lineId).toBe('line_a');

    expect(lines[1].productSlug).toBe('prod-b');
    expect(lines[1].qty).toBe(3);
    expect(lines[1].lineId).toBe('line_b');
  });

  it('filters out gift-wrap line items', () => {
    const cart = makeCart([
      makeItem({ id: 'line_1', variant_id: 'var_1', quantity: 1, product_handle: 'signal-line' }),
      makeItem({ id: 'line_gw', variant_id: 'var_gw', quantity: 1, product_handle: GIFT_WRAP_PRODUCT_HANDLE }),
    ]);

    const lines = toCartLines(cart);
    expect(lines).toHaveLength(1);
    expect(lines[0].productSlug).toBe('signal-line');
  });

  it('handles empty cart items', () => {
    const cart = makeCart([]);
    expect(toCartLines(cart)).toEqual([]);
  });

  it('handles cart with no items property', () => {
    const cart: MedusaCart = { id: 'cart_empty', currency_code: 'egp' } as MedusaCart;
    expect(toCartLines(cart)).toEqual([]);
  });

  it('normalizes variant_title to uppercase ProductSizeKey', () => {
    const cart = makeCart([
      makeItem({ id: 'line_1', variant_id: 'var_1', quantity: 1, variant_title: 'xl' }),
    ]);
    const lines = toCartLines(cart);
    expect(lines[0].size).toBe('XL');
  });

  it('extracts size from "M / Black" variant title format', () => {
    const cart = makeCart([
      makeItem({ id: 'line_1', variant_id: 'var_1', quantity: 1, variant_title: 'L / Black' }),
    ]);
    const lines = toCartLines(cart);
    expect(lines[0].size).toBe('L');
  });

  it('defaults to M when variant_title is not a valid size', () => {
    const cart = makeCart([
      makeItem({ id: 'line_1', variant_id: 'var_1', quantity: 1, variant_title: 'Custom' }),
    ]);
    const lines = toCartLines(cart);
    expect(lines[0].size).toBe('M');
  });

  it('each line has a unique lineId', () => {
    const cart = makeCart([
      makeItem({ id: 'line_a', variant_id: 'var_a', quantity: 1, product_handle: 'prod-a' }),
      makeItem({ id: 'line_b', variant_id: 'var_b', quantity: 1, product_handle: 'prod-a' }),
      makeItem({ id: 'line_c', variant_id: 'var_c', quantity: 1, product_handle: 'prod-b' }),
    ]);
    const lines = toCartLines(cart);
    const lineIds = lines.map((l) => l.lineId);
    expect(new Set(lineIds).size).toBe(lineIds.length);
  });
});

describe('getGiftWrapLineItem', () => {
  it('finds the gift wrap line in a cart', () => {
    const cart = makeCart([
      makeItem({ id: 'line_1', variant_id: 'var_1', quantity: 1, product_handle: 'signal-line' }),
      makeItem({ id: 'line_gw', variant_id: 'var_gw', quantity: 1, product_handle: GIFT_WRAP_PRODUCT_HANDLE }),
    ]);
    const gw = getGiftWrapLineItem(cart);
    expect(gw).not.toBeNull();
    expect(gw!.id).toBe('line_gw');
  });

  it('returns null when no gift wrap line exists', () => {
    const cart = makeCart([
      makeItem({ id: 'line_1', variant_id: 'var_1', quantity: 1, product_handle: 'signal-line' }),
    ]);
    expect(getGiftWrapLineItem(cart)).toBeNull();
  });
});

describe('getCartGiftWrapEgp', () => {
  it('returns 0 for carts without gift wrap', () => {
    const cart = makeCart([
      makeItem({ id: 'line_1', variant_id: 'var_1', quantity: 1, product_handle: 'signal-line' }),
    ]);
    expect(getCartGiftWrapEgp(cart)).toBe(0);
  });

  it('reads gift wrap total from line total', () => {
    const cart = makeCart([
      makeItem({ id: 'line_gw', variant_id: 'var_gw', quantity: 1, product_handle: GIFT_WRAP_PRODUCT_HANDLE, total: 200, unit_price: 200 }),
    ]);
    expect(getCartGiftWrapEgp(cart)).toBe(200);
  });
});
