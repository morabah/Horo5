import type { CartLine } from '../cart/types';
import type { MedusaCart } from './medusa/types';

/**
 * Concurrency is intentionally `1`: Medusa V2 line-item POSTs mutate the same cart
 * aggregate (subtotal/total/line list), and concurrent writes against a single cart
 * race — the response of an in-flight POST observes the totals at that moment, so the
 * "last response wins" pattern can drop earlier line additions from the returned cart
 * and silently produce out-of-sync subtotals. Re-adding the local bag during checkout
 * is bounded by the number of cart lines (typically <10), so a serial loop is fast
 * enough and keeps the final response authoritative.
 */
export const DEFAULT_CHECKOUT_LINE_ADD_CONCURRENCY = 1;

type AddLineResult = { cart: MedusaCart };

/**
 * Per-(cart, variant) idempotency key so a transient network retry while seeding a brand
 * new checkout cart cannot double-add the same line.
 */
export function checkoutCartRebuildLineIdempotencyKey(cartId: string, variantId: string): string {
  return `rebuild_${cartId}_${variantId}`;
}

type AddLineItemFn = (
  cartId: string,
  variantId: string,
  quantity: number,
  options?: { idempotencyKey?: string },
) => Promise<AddLineResult>;

/**
 * Re-adds local bag lines to a fresh Medusa cart, serializing line POSTs against the
 * same cart so the final response is authoritative (see
 * `DEFAULT_CHECKOUT_LINE_ADD_CONCURRENCY` for why concurrent writes are unsafe).
 *
 * Each POST carries a deterministic Idempotency-Key derived from (cart id, variant id)
 * so retries after a transient failure stay safe (issue #9).
 */
export async function addCheckoutCartLinesInParallelBatches(
  cartId: string,
  lines: CartLine[],
  resolveVariantId: (line: CartLine) => string | null,
  addLineItem: AddLineItemFn,
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

  for (const { line, variantId } of work) {
    const r = await addLineItem(cartId, variantId, line.qty, {
      idempotencyKey: checkoutCartRebuildLineIdempotencyKey(cartId, variantId),
    });
    cart = r.cart;
    addedLineCount += 1;
  }

  if (!cart) {
    throw new Error('addLineItem did not return a cart.');
  }

  return { cart, addedLineCount };
}
