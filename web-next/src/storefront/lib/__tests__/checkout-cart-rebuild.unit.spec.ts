import { jest } from '@jest/globals';
import type { CartLine } from '../../cart/types';
import type { MedusaCart } from '../medusa/types';
import { addCheckoutCartLinesInParallelBatches, DEFAULT_CHECKOUT_LINE_ADD_CONCURRENCY } from '../checkout-cart-rebuild';

function cart(id: string): MedusaCart {
  return { id } as MedusaCart;
}

describe('addCheckoutCartLinesInParallelBatches', () => {
  it('batches addLineItem calls with concurrency 4', async () => {
    const lines: CartLine[] = [
      { productSlug: 'a', size: 'M', qty: 1, variantId: 'v1' },
      { productSlug: 'b', size: 'M', qty: 2, variantId: 'v2' },
      { productSlug: 'c', size: 'M', qty: 1, variantId: 'v3' },
      { productSlug: 'd', size: 'M', qty: 1, variantId: 'v4' },
      { productSlug: 'e', size: 'M', qty: 1, variantId: 'v5' },
    ];

    const addLineItem = jest.fn(async (_cid: string, vid: string, qty: number) => ({
      cart: cart(`cart-with-${vid}-qty-${qty}`),
    }));

    const { cart: lastCart, addedLineCount } = await addCheckoutCartLinesInParallelBatches(
      'cart_root',
      lines,
      (line) => line.variantId ?? null,
      addLineItem,
      DEFAULT_CHECKOUT_LINE_ADD_CONCURRENCY,
    );

    expect(addedLineCount).toBe(5);
    expect(addLineItem).toHaveBeenCalledTimes(5);
    expect(lastCart.id).toBe('cart-with-v5-qty-1');

    const parallelWave1 = addLineItem.mock.invocationCallOrder.slice(0, 4);
    const wave2 = addLineItem.mock.invocationCallOrder[4];
    expect(Math.max(...parallelWave1)).toBeLessThan(wave2!);
  });

  it('skips lines without variant id', async () => {
    const lines: CartLine[] = [
      { productSlug: 'a', size: 'M', qty: 1 },
    ];

    const addLineItemFn = jest.fn();
    const addLineItem = addLineItemFn as unknown as (
      cartId: string,
      variantId: string,
      quantity: number,
    ) => Promise<{ cart: MedusaCart }>;

    await expect(
      addCheckoutCartLinesInParallelBatches('c1', lines, () => null, addLineItem, 4),
    ).rejects.toThrow('No lines');

    expect(addLineItemFn).not.toHaveBeenCalled();
  });
});
