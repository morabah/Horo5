import { updateMedusaCartLineQtyOptimistically } from '../medusa-cart-optimistic';
import type { MedusaCart } from '../../lib/medusa/types';

function makeCart(): MedusaCart {
  return {
    id: 'cart_1',
    currency_code: 'egp',
    subtotal: 320,
    shipping_total: 50,
    total: 370,
    items: [
      {
        id: 'line_a',
        product_handle: 'signal-line',
        product_title: 'Signal Line',
        quantity: 1,
        total: 100,
        unit_price: 100,
        variant_id: 'var_a',
        variant_title: 'M',
      },
      {
        id: 'line_b',
        product_handle: 'quiet-revolt',
        product_title: 'Quiet Revolt',
        quantity: 2,
        total: 220,
        unit_price: 110,
        variant_id: 'var_b',
        variant_title: 'L',
      },
    ],
  };
}

describe('updateMedusaCartLineQtyOptimistically', () => {
  it('updates quantity and totals for only the selected server line', () => {
    const next = updateMedusaCartLineQtyOptimistically(
      makeCart(),
      { productSlug: 'signal-line', size: 'M', lineId: 'line_a' },
      3,
    );

    expect(next.items).toHaveLength(2);
    expect(next.items[0]).toMatchObject({ id: 'line_a', quantity: 3, total: 300 });
    expect(next.items[1]).toMatchObject({ id: 'line_b', quantity: 2, total: 220 });
    expect(next.subtotal).toBe(520);
    expect(next.shipping_total).toBe(50);
    expect(next.total).toBe(570);
  });

  it('removes only the selected line for optimistic checkout removal', () => {
    const next = updateMedusaCartLineQtyOptimistically(
      makeCart(),
      { productSlug: 'quiet-revolt', size: 'L', lineId: 'line_b' },
      0,
    );

    expect(next.items.map((item) => item.id)).toEqual(['line_a']);
    expect(next.subtotal).toBe(100);
    expect(next.total).toBe(150);
  });

  // ---- New tests for isolation ----

  it('does not modify the second item when increasing the first', () => {
    const cart = makeCart();
    const next = updateMedusaCartLineQtyOptimistically(
      cart,
      { productSlug: 'signal-line', size: 'M', lineId: 'line_a' },
      5,
    );

    // First line: 5 * 100 = 500
    expect(next.items[0].quantity).toBe(5);
    expect(next.items[0].total).toBe(500);

    // Second line: unchanged
    expect(next.items[1].quantity).toBe(2);
    expect(next.items[1].total).toBe(220);

    // Cart totals: delta = 500 - 100 = +400
    expect(next.subtotal).toBe(720);
    expect(next.total).toBe(770);
  });

  it('does not modify the first item when decreasing the second', () => {
    const cart = makeCart();
    const next = updateMedusaCartLineQtyOptimistically(
      cart,
      { productSlug: 'quiet-revolt', size: 'L', lineId: 'line_b' },
      1,
    );

    // First line: unchanged
    expect(next.items[0].quantity).toBe(1);
    expect(next.items[0].total).toBe(100);

    // Second line: 1 * 110 = 110
    expect(next.items[1].quantity).toBe(1);
    expect(next.items[1].total).toBe(110);

    // Cart totals: delta = 110 - 220 = -110
    expect(next.subtotal).toBe(210);
    expect(next.total).toBe(260);
  });

  it('returns the same cart when identity does not match any line', () => {
    const cart = makeCart();
    const next = updateMedusaCartLineQtyOptimistically(
      cart,
      { productSlug: 'nonexistent', size: 'M', lineId: 'line_z' },
      5,
    );
    expect(next).toBe(cart);
  });

  it('matches by variant_id when lineId is not provided', () => {
    const cart = makeCart();
    const next = updateMedusaCartLineQtyOptimistically(
      cart,
      { productSlug: 'signal-line', size: 'M', variantId: 'var_a' },
      4,
    );
    expect(next.items[0].quantity).toBe(4);
    expect(next.items[0].total).toBe(400);
    expect(next.items[1]).toMatchObject({ quantity: 2, total: 220 });
  });

  it('sequential updates produce correct isolated results', () => {
    let cart = makeCart();

    // Step 1: increase first item to 3
    cart = updateMedusaCartLineQtyOptimistically(
      cart,
      { productSlug: 'signal-line', size: 'M', lineId: 'line_a' },
      3,
    );
    expect(cart.items[0].quantity).toBe(3);
    expect(cart.items[1].quantity).toBe(2);
    expect(cart.subtotal).toBe(520);

    // Step 2: decrease second item to 1
    cart = updateMedusaCartLineQtyOptimistically(
      cart,
      { productSlug: 'quiet-revolt', size: 'L', lineId: 'line_b' },
      1,
    );
    expect(cart.items[0].quantity).toBe(3);
    expect(cart.items[1].quantity).toBe(1);
    expect(cart.subtotal).toBe(410);

    // Step 3: increase first item again to 4
    cart = updateMedusaCartLineQtyOptimistically(
      cart,
      { productSlug: 'signal-line', size: 'M', lineId: 'line_a' },
      4,
    );
    expect(cart.items[0].quantity).toBe(4);
    expect(cart.items[1].quantity).toBe(1);
    expect(cart.subtotal).toBe(510);
  });

  it('does not mutate the original cart', () => {
    const cart = makeCart();
    const originalSubtotal = cart.subtotal;
    const originalItemQty = cart.items[0].quantity;

    updateMedusaCartLineQtyOptimistically(
      cart,
      { productSlug: 'signal-line', size: 'M', lineId: 'line_a' },
      10,
    );

    expect(cart.subtotal).toBe(originalSubtotal);
    expect(cart.items[0].quantity).toBe(originalItemQty);
  });

  it('handles a cart with three items and updates only the middle one', () => {
    const threeItemCart: MedusaCart = {
      id: 'cart_3',
      currency_code: 'egp',
      subtotal: 400,
      total: 450,
      items: [
        { id: 'line_1', product_handle: 'prod-a', product_title: 'A', quantity: 1, total: 100, unit_price: 100, variant_id: 'va' },
        { id: 'line_2', product_handle: 'prod-b', product_title: 'B', quantity: 2, total: 200, unit_price: 100, variant_id: 'vb' },
        { id: 'line_3', product_handle: 'prod-c', product_title: 'C', quantity: 1, total: 100, unit_price: 100, variant_id: 'vc' },
      ],
    };

    const next = updateMedusaCartLineQtyOptimistically(
      threeItemCart,
      { productSlug: 'prod-b', size: 'M', lineId: 'line_2' },
      5,
    );

    expect(next.items[0]).toMatchObject({ id: 'line_1', quantity: 1, total: 100 });
    expect(next.items[1]).toMatchObject({ id: 'line_2', quantity: 5, total: 500 });
    expect(next.items[2]).toMatchObject({ id: 'line_3', quantity: 1, total: 100 });
    // delta: 500 - 200 = 300
    expect(next.subtotal).toBe(700);
    expect(next.total).toBe(750);
  });

  it('handles removal when only one item exists', () => {
    const singleItemCart: MedusaCart = {
      id: 'cart_s',
      currency_code: 'egp',
      subtotal: 200,
      total: 250,
      items: [
        { id: 'line_only', product_handle: 'only-prod', product_title: 'Only', quantity: 2, total: 200, unit_price: 100, variant_id: 'v1' },
      ],
    };

    const next = updateMedusaCartLineQtyOptimistically(
      singleItemCart,
      { productSlug: 'only-prod', size: 'M', lineId: 'line_only' },
      0,
    );

    expect(next.items).toHaveLength(0);
    expect(next.subtotal).toBe(0);
    expect(next.total).toBe(50);
  });
});
