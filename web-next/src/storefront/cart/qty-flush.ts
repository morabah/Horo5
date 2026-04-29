import type { MedusaCart } from '../lib/medusa/types';

/**
 * Single-flight, serial-write quantity flusher.
 *
 * Why this exists:
 * - Medusa V2 cart writes against the same cart aggregate race (totals/lines/payment
 *   collection observe whichever request reads first). The repo already serializes
 *   line POSTs in `lib/checkout-cart-rebuild.ts` for that reason.
 * - Optimistic stepper clicks (+/-) are debounced into a pending map, then flushed
 *   to Medusa. Without single-flight discipline, a timer-driven flush could fire
 *   while a previous flush was still awaiting the network, issuing concurrent
 *   `updateLineItem` POSTs whose responses can commit out-of-order and snap the
 *   UI back to a stale qty.
 *
 * Invariants enforced here:
 * 1. Single-flight: at most one drain loop is active per runner. Concurrent `run()`
 *    callers await the in-flight flush; new pending entries queued mid-flush are
 *    absorbed by the running drain loop before it returns.
 * 2. Serial per-line writes: within one drain iteration, `updateLineItem` is called
 *    in sequence (concurrency = 1). The last successful response is the
 *    authoritative cart state, so no follow-up `getCart` round-trip is required.
 * 3. Generation invalidation: a `clearCart` (which bumps the generation) makes the
 *    drain loop bail before its next write and skip applying the response.
 *
 * The runner is intentionally framework-agnostic so it can be unit-tested with
 * mocked promises, no React/JSDOM required.
 */

export type QtyFlushPending = { lineId: string; qty: number };

export type QtyFlushDeps = {
  /** Atomically capture and clear the current pending map. */
  drainPending: () => Map<string, QtyFlushPending>;
  /** True when there are pending entries waiting (used post-await to skip no-ops). */
  hasPending: () => boolean;
  /** Currently active Medusa cart id, or `null` when none has been created yet. */
  getCartId: () => string | null;
  /** Generation counter; bumped by `clearCart` so in-flight writes self-invalidate. */
  getGeneration: () => number;
  /** Sequential per-line update against Medusa. */
  updateLineItem: (cartId: string, lineId: string, qty: number) => Promise<{ cart: MedusaCart }>;
  /** Fallback resync when an update fails (e.g. 4xx). */
  syncCart: (cartId: string) => Promise<void>;
  /** Apply the latest cart response to local state. */
  applyCart: (cart: MedusaCart, generation: number) => void;
  /** Mutable set of keys whose updates are mid-flush (drives the "saving" indicator). */
  flushingKeys: Set<string>;
  /** Refresh derived "is saving" state in the React tree. */
  refreshSavingState: () => void;
  /** Optional hook used by the storefront to wipe a stale cart id when Medusa returns 404. */
  on404?: (err: unknown, generation: number) => void;
};

export type QtyFlushRunner = {
  /** Single-flight flush. Concurrent invocations await the running flush. */
  run: () => Promise<void>;
  /** Test helper: returns true when a drain loop is currently in flight. */
  isRunning: () => boolean;
};

export function createQtyFlushRunner(deps: QtyFlushDeps): QtyFlushRunner {
  let inFlight: Promise<void> | null = null;

  async function drain(): Promise<void> {
    // Loop drains pending entries until empty. Anything queued during an `await`
    // below lands in `pendingQtyByKeyRef` and is picked up on the next iteration.
    for (;;) {
      const pending = deps.drainPending();
      if (pending.size === 0) return;

      const cartId = deps.getCartId();
      if (!cartId) return;

      const gen = deps.getGeneration();
      const pendingKeys = [...pending.keys()];
      pendingKeys.forEach((k) => deps.flushingKeys.add(k));
      deps.refreshSavingState();

      // Latest qty per lineId (multiple clicks within one debounce window collapse to one PUT).
      const byLineId = new Map<string, number>();
      for (const { lineId, qty } of pending.values()) byLineId.set(lineId, qty);

      let lastCart: MedusaCart | null = null;
      let hadError = false;
      try {
        for (const [lineId, qty] of byLineId) {
          if (deps.getGeneration() !== gen) {
            // Cart was cleared / replaced mid-flush; abandon remaining writes.
            hadError = true;
            break;
          }
          try {
            const res = await deps.updateLineItem(cartId, lineId, qty);
            lastCart = res.cart;
          } catch (err: unknown) {
            hadError = true;
            deps.on404?.(err, gen);
          }
        }

        if (hadError) {
          if (deps.getGeneration() === gen && deps.getCartId() === cartId) {
            await deps.syncCart(cartId);
          }
          return;
        }

        if (lastCart && deps.getGeneration() === gen) {
          deps.applyCart(lastCart, gen);
        }
      } finally {
        pendingKeys.forEach((k) => deps.flushingKeys.delete(k));
        deps.refreshSavingState();
      }
    }
  }

  async function run(): Promise<void> {
    if (inFlight) {
      // Concurrent caller: piggy-back on the running flush. Its drain loop will
      // absorb any entries we just queued before returning.
      await inFlight;
      if (!deps.hasPending()) {
        deps.refreshSavingState();
        return;
      }
      // Fall through to start a fresh flush for entries that landed at the boundary.
    }

    const promise = (async () => {
      try {
        await drain();
      } finally {
        deps.refreshSavingState();
      }
    })();
    inFlight = promise;
    try {
      await promise;
    } finally {
      if (inFlight === promise) inFlight = null;
    }
  }

  return {
    run,
    isRunning: () => inFlight !== null,
  };
}
