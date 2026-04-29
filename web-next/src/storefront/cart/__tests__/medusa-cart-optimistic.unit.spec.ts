import { updateMedusaCartLineQtyOptimistically } from '../medusa-cart-optimistic';
import type { MedusaCart } from '../../lib/medusa/types';

function cart(): MedusaCart {
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
      cart(),
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
      cart(),
      { productSlug: 'quiet-revolt', size: 'L', lineId: 'line_b' },
      0,
    );

    expect(next.items.map((item) => item.id)).toEqual(['line_a']);
    expect(next.subtotal).toBe(100);
    expect(next.total).toBe(150);
  });
});
