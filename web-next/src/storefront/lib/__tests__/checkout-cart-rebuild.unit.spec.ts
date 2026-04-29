import { jest } from '@jest/globals';
import type { CartLine } from '../../cart/types';
import type { MedusaCart } from '../medusa/types';
import {
  addCheckoutCartLinesInParallelBatches,
  checkoutCartRebuildLineIdempotencyKey,
} from '../checkout-cart-rebuild';

function cart(id: string): MedusaCart {
  return { id } as MedusaCart;
}

describe('addCheckoutCartLinesInParallelBatches', () => {
  it('serializes addLineItem calls so each POST observes the previous one', async () => {
    const lines: CartLine[] = [
      { productSlug: 'a', size: 'M', qty: 1, variantId: 'v1' },
      { productSlug: 'b', size: 'M', qty: 2, variantId: 'v2' },
      { productSlug: 'c', size: 'M', qty: 1, variantId: 'v3' },
      { productSlug: 'd', size: 'M', qty: 1, variantId: 'v4' },
      { productSlug: 'e', size: 'M', qty: 1, variantId: 'v5' },
    ];

    let inFlight = 0;
    let maxInFlight = 0;
    const addLineItemImpl = jest.fn(async (_cid: string, vid: string, qty: number) => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await Promise.resolve();
      inFlight -= 1;
      return { cart: cart(`cart-with-${vid}-qty-${qty}`) };
    });
    const addLineItem = addLineItemImpl as unknown as (
      cartId: string,
      variantId: string,
      quantity: number,
      options?: { idempotencyKey?: string },
    ) => Promise<{ cart: MedusaCart }>;

    const { cart: lastCart, addedLineCount } = await addCheckoutCartLinesInParallelBatches(
      'cart_root',
      lines,
      (line) => line.variantId ?? null,
      addLineItem,
    );

    expect(addedLineCount).toBe(5);
    expect(addLineItemImpl).toHaveBeenCalledTimes(5);
    // Final cart is the response of the last POST — authoritative for sequential writes.
    expect(lastCart.id).toBe('cart-with-v5-qty-1');
    // Concurrent writes against the same Medusa cart race; assert we never had >1 outstanding.
    expect(maxInFlight).toBe(1);
    // Calls were issued in input order.
    const order = addLineItemImpl.mock.invocationCallOrder;
    for (let i = 1; i < order.length; i += 1) {
      expect(order[i]).toBeGreaterThan(order[i - 1]!);
    }

    // Each POST carries a deterministic Idempotency-Key per (cart, variant).
    for (const call of addLineItemImpl.mock.calls) {
      const [callCartId, callVariantId, , callOptions] = call as unknown as [
        string,
        string,
        number,
        { idempotencyKey?: string } | undefined,
      ];
      expect(callOptions?.idempotencyKey).toBe(
        checkoutCartRebuildLineIdempotencyKey(callCartId, callVariantId),
      );
    }
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
      options?: { idempotencyKey?: string },
    ) => Promise<{ cart: MedusaCart }>;

    await expect(
      addCheckoutCartLinesInParallelBatches('c1', lines, () => null, addLineItem),
    ).rejects.toThrow('No lines');

    expect(addLineItemFn).not.toHaveBeenCalled();
  });
});
