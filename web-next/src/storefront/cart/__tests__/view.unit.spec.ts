import { getCartLineView } from '../view';
import type { CartLine } from '../types';

describe('getCartLineView medusaLineTotalEgp', () => {
  it('uses medusa line total when present instead of unitPrice * qty', () => {
    const line: CartLine = {
      productSlug: 'unknown-slug-xyz',
      productName: 'Test tee',
      size: 'M',
      qty: 2,
      unitPriceEgp: 100,
      medusaLineTotalEgp: 350,
    };
    const view = getCartLineView(line, { orderConfirmation: true });
    expect(view?.linePriceEgp).toBe(350);
  });
});
