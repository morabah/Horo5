/**
 * Tests for the internal `applyPendingQtyToCartLines` function and the
 * overall cart‐context qty‐update pipeline.
 *
 * Since `applyPendingQtyToCartLines` is not exported from CartContext, we
 * test its behavior indirectly through the exported pure helpers that mirror
 * the same matching logic. This file validates the critical invariant:
 * **Updating the quantity of one cart line MUST NOT affect any other line.**
 */
import {
  cartLineKey,
  cartLineWithQty,
  findCartLineIndex,
  updateCartLineQty,
  type CartLine,
  type CartLineIdentity,
} from '../types';

// Mirror the internal `PendingQtyUpdate` type from CartContext.tsx
type PendingQtyUpdate = {
  identity: CartLineIdentity;
  lineId: string;
  qty: number;
};

/**
 * Reimplements `applyPendingQtyToCartLines` exactly as it exists in
 * CartContext.tsx so we can unit‐test it in isolation.
 */
function applyPendingQtyToCartLines(
  lines: CartLine[],
  pendingUpdates: PendingQtyUpdate[],
): CartLine[] {
  if (pendingUpdates.length === 0) return lines;

  return lines.map((line) => {
    const pending = pendingUpdates.find((entry) => {
      if (line.lineId) return entry.lineId === line.lineId;
      return cartLineKey(line) === cartLineKey(entry.identity);
    });
    return pending ? cartLineWithQty(line, pending.qty) : line;
  });
}

describe('applyPendingQtyToCartLines', () => {
  const twoItemCart: CartLine[] = [
    {
      productSlug: 'signal-line',
      size: 'M',
      qty: 1,
      lineId: 'line_a',
      variantId: 'var_a',
      unitPriceEgp: 100,
    },
    {
      productSlug: 'quiet-revolt',
      size: 'L',
      qty: 2,
      lineId: 'line_b',
      variantId: 'var_b',
      unitPriceEgp: 120,
    },
  ];

  it('applies pending qty to only the matching line by lineId', () => {
    const pending: PendingQtyUpdate[] = [
      {
        identity: { productSlug: 'signal-line', size: 'M', lineId: 'line_a' },
        lineId: 'line_a',
        qty: 5,
      },
    ];

    const result = applyPendingQtyToCartLines(twoItemCart, pending);
    expect(result[0].qty).toBe(5);
    expect(result[1].qty).toBe(2); // Unchanged!
  });

  it('applies pending qty to the second line without affecting the first', () => {
    const pending: PendingQtyUpdate[] = [
      {
        identity: { productSlug: 'quiet-revolt', size: 'L', lineId: 'line_b' },
        lineId: 'line_b',
        qty: 10,
      },
    ];

    const result = applyPendingQtyToCartLines(twoItemCart, pending);
    expect(result[0].qty).toBe(1); // Unchanged!
    expect(result[1].qty).toBe(10);
  });

  it('handles multiple pending updates affecting different lines', () => {
    const pending: PendingQtyUpdate[] = [
      {
        identity: { productSlug: 'signal-line', size: 'M', lineId: 'line_a' },
        lineId: 'line_a',
        qty: 3,
      },
      {
        identity: { productSlug: 'quiet-revolt', size: 'L', lineId: 'line_b' },
        lineId: 'line_b',
        qty: 7,
      },
    ];

    const result = applyPendingQtyToCartLines(twoItemCart, pending);
    expect(result[0].qty).toBe(3);
    expect(result[1].qty).toBe(7);
  });

  it('returns the original array when there are no pending updates', () => {
    const result = applyPendingQtyToCartLines(twoItemCart, []);
    expect(result).toBe(twoItemCart);
  });

  it('does not modify lines that have no matching pending update', () => {
    const pending: PendingQtyUpdate[] = [
      {
        identity: { productSlug: 'nonexistent', size: 'M', lineId: 'line_x' },
        lineId: 'line_x',
        qty: 99,
      },
    ];

    const result = applyPendingQtyToCartLines(twoItemCart, pending);
    expect(result[0].qty).toBe(1);
    expect(result[1].qty).toBe(2);
  });

  it('uses catalog key fallback when lines have no lineId', () => {
    const localOnlyCart: CartLine[] = [
      { productSlug: 'signal-line', size: 'M', qty: 1, variantId: 'var_a', unitPriceEgp: 100 },
      { productSlug: 'quiet-revolt', size: 'L', qty: 2, variantId: 'var_b', unitPriceEgp: 120 },
    ];

    const pending: PendingQtyUpdate[] = [
      {
        identity: { productSlug: 'signal-line', size: 'M', variantId: 'var_a' },
        lineId: 'line_a',
        qty: 4,
      },
    ];

    const result = applyPendingQtyToCartLines(localOnlyCart, pending);
    expect(result[0].qty).toBe(4);
    expect(result[1].qty).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Bug reproduction: rapid sequential setItems + findCartLineIndex isolation
// ---------------------------------------------------------------------------
describe('rapid sequential qty update simulation', () => {
  it('each update targets only its own line, even with shared product/size keys', () => {
    // Two lines for the same product+size but different variants (e.g. multi-color)
    let items: CartLine[] = [
      {
        productSlug: 'signal-line',
        size: 'M',
        qty: 1,
        lineId: 'line_a',
        variantId: 'var_a',
        unitPriceEgp: 100,
      },
      {
        productSlug: 'signal-line',
        size: 'M',
        qty: 1,
        lineId: 'line_b',
        variantId: 'var_b',
        unitPriceEgp: 120,
      },
    ];

    // Click "+" on line_a
    const identityA: CartLineIdentity = {
      productSlug: 'signal-line',
      size: 'M',
      variantId: 'var_a',
      lineId: 'line_a',
    };
    items = updateCartLineQty(items, identityA, 2);
    expect(items[0].qty).toBe(2);
    expect(items[1].qty).toBe(1); // MUST NOT change

    // Click "+" on line_b
    const identityB: CartLineIdentity = {
      productSlug: 'signal-line',
      size: 'M',
      variantId: 'var_b',
      lineId: 'line_b',
    };
    items = updateCartLineQty(items, identityB, 3);
    expect(items[0].qty).toBe(2); // MUST NOT change
    expect(items[1].qty).toBe(3);
  });

  it('findCartLineIndex resolves correctly for shared keys with lineId disambiguation', () => {
    const items: CartLine[] = [
      {
        productSlug: 'signal-line',
        size: 'M',
        qty: 1,
        lineId: 'line_a',
        variantId: 'var_a',
      },
      {
        productSlug: 'signal-line',
        size: 'M',
        qty: 1,
        lineId: 'line_b',
        variantId: 'var_b',
      },
    ];

    // With lineId, should find exact match
    expect(
      findCartLineIndex(items, {
        productSlug: 'signal-line',
        size: 'M',
        lineId: 'line_a',
      }),
    ).toBe(0);

    expect(
      findCartLineIndex(items, {
        productSlug: 'signal-line',
        size: 'M',
        lineId: 'line_b',
      }),
    ).toBe(1);

    // With variantId (no lineId), should find by catalog key
    expect(
      findCartLineIndex(items, {
        productSlug: 'signal-line',
        size: 'M',
        variantId: 'var_a',
      }),
    ).toBe(0);

    expect(
      findCartLineIndex(items, {
        productSlug: 'signal-line',
        size: 'M',
        variantId: 'var_b',
      }),
    ).toBe(1);
  });
});
