import type { MedusaCart } from '../lib/medusa/types';

/**
 * Cross-tab cart synchronisation using `BroadcastChannel`.
 *
 * Why this exists:
 * - The single-flight + serial-write flush in `qty-flush.ts` makes ONE tab safe
 *   against rapid clicks. It does NOT, on its own, make TWO tabs of the SAME
 *   user safe — both tabs share the same Medusa cart id (localStorage + cookie)
 *   and would otherwise issue parallel `updateLineItem` writes against the same
 *   cart, racing at Medusa exactly like the original bug did per-tab.
 *
 * - Different users see entirely separate Medusa carts (each browser session
 *   creates its own anonymous cart), so there is no cross-user cart race here;
 *   stock contention between distinct users is enforced by Medusa's reservation
 *   workflow at order completion (see `completeCart`), not at the cart layer.
 *
 * What this module guarantees for same-user multi-tab:
 * - When tab A finishes a Medusa write, it broadcasts the resulting cart
 *   snapshot. Tab B receives it and re-renders from the authoritative payload
 *   instead of holding stale optimistic state.
 * - When tab A clears its cart (e.g. after a successful order), it broadcasts a
 *   clear signal so tab B does not keep showing a completed cart.
 *
 * The sender does NOT receive its own messages (`BroadcastChannel` semantics),
 * so no echo loop is possible. SSR-safe: returns a no-op when `window` or
 * `BroadcastChannel` is undefined.
 */

const CART_BROADCAST_CHANNEL = 'horo:cart:v1';

type CartBroadcastMessage =
  | { type: 'snapshot'; cart: MedusaCart }
  | { type: 'clear' };

export type CartBroadcastHandlers = {
  onSnapshot: (cart: MedusaCart) => void;
  onClear: () => void;
};

export type CartBroadcast = {
  broadcastSnapshot: (cart: MedusaCart) => void;
  broadcastClear: () => void;
  close: () => void;
};

const NOOP_BROADCAST: CartBroadcast = {
  broadcastSnapshot: () => {},
  broadcastClear: () => {},
  close: () => {},
};

export function createCartBroadcast(handlers: CartBroadcastHandlers): CartBroadcast {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
    return NOOP_BROADCAST;
  }

  let channel: BroadcastChannel | null;
  try {
    channel = new BroadcastChannel(CART_BROADCAST_CHANNEL);
  } catch {
    return NOOP_BROADCAST;
  }

  const onMessage = (event: MessageEvent<CartBroadcastMessage>) => {
    const data = event.data;
    if (!data || typeof data !== 'object') return;
    if (data.type === 'snapshot' && data.cart) {
      handlers.onSnapshot(data.cart);
    } else if (data.type === 'clear') {
      handlers.onClear();
    }
  };
  channel.addEventListener('message', onMessage);

  return {
    broadcastSnapshot(cart) {
      try {
        channel?.postMessage({ type: 'snapshot', cart } satisfies CartBroadcastMessage);
      } catch {
        /* channel was closed or message wasn't structurally cloneable */
      }
    },
    broadcastClear() {
      try {
        channel?.postMessage({ type: 'clear' } satisfies CartBroadcastMessage);
      } catch {
        /* ignore */
      }
    },
    close() {
      try {
        channel?.removeEventListener('message', onMessage);
        channel?.close();
      } catch {
        /* ignore */
      }
      channel = null;
    },
  };
}
