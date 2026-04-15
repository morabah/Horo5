import type { CartLine } from '../cart/types';
import type { MedusaCart } from './medusa/types';

export const DEFAULT_CHECKOUT_LINE_ADD_CONCURRENCY = 4;

type AddLineResult = { cart: MedusaCart };

/**
 * Re-adds local bag lines to a fresh Medusa cart with bounded concurrency (Medusa line POSTs per variant).
 */
export async function addCheckoutCartLinesInParallelBatches(
  cartId: string,
  lines: CartLine[],
  resolveVariantId: (line: CartLine) => string | null,
  addLineItem: (cartId: string, variantId: string, quantity: number) => Promise<AddLineResult>,
  concurrency: number = DEFAULT_CHECKOUT_LINE_ADD_CONCURRENCY,
): Promise<{ cart: MedusaCart; addedLineCount: number }> {
  const work = lines
    .map((line) => {
      const variantId = resolveVariantId(line);
      if (!variantId) return null;
      return { line, variantId };
    })
    .filter((x): x is { line: CartLine; variantId: string } => x !== null);

  if (work.length === 0) {
    throw new Error('No lines with resolvable variant ids.');
  }

  let cart: MedusaCart | null = null;
  let addedLineCount = 0;

  for (let i = 0; i < work.length; i += concurrency) {
    const batch = work.slice(i, i + concurrency);
    const results = await Promise.all(
      batch.map(({ line, variantId }) => addLineItem(cartId, variantId, line.qty)),
    );
    for (const r of results) {
      cart = r.cart;
      addedLineCount += 1;
    }
  }

  if (!cart) {
    throw new Error('addLineItem did not return a cart.');
  }

  return { cart, addedLineCount };
}
