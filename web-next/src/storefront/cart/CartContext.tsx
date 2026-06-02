/**
 * CartContext — concurrency & stock model
 * ---------------------------------------
 *
 * One source of truth: Medusa.
 * Cart and Checkout are rendered from the same `CartProvider`, which holds
 * exactly one Medusa cart id at a time. Both pages call `useCart().setLineQty`
 * / `removeItem`, so EVERY +/- click goes through the same single-flight
 * serial-write runner in `qty-flush.ts` — the cart-page fix automatically
 * applies to the checkout-page summary stepper (`Checkout.tsx`'s
 * `OrderSummaryWithSteppers`). Regression-tested at unit level in
 * `__tests__/qty-flush.unit.spec.ts` and at E2E level in
 * `e2e/customer-journey-cart-checkout.spec.ts` (one test per route).
 *
 * 1) Different users (different sessions / devices)
 *    Each browser session creates its own anonymous Medusa cart (`POST /store/carts`)
 *    and persists the id in `localStorage` + `horo_cart_id` cookie. Different users
 *    therefore have **completely separate carts** — there is no cross-user race
 *    at the cart layer no matter how many users click +/- simultaneously.
 *
 *    Stock contention between distinct users is enforced (when enabled — see §4)
 *    by Medusa's reservation workflow at order completion. `completeCartWorkflow`
 *    invokes `reserveInventoryStep`, which atomically decrements `stocked_quantity`
 *    via a reservation; if two users try to buy the last unit at the same time
 *    exactly one `complete` succeeds and the other surfaces an inventory error
 *    in `Checkout.tsx`. The local `getProductSizeStockLimit` check is a UX guard
 *    only — it is NOT a substitute for server-side stock.
 *
 * 2) Same user, same tab — rapid +/- clicks
 *    Optimistic state updates synchronously; Medusa writes are debounced (50ms)
 *    and run through the **single-flight serial-write** runner in `qty-flush.ts`.
 *    No two `updateLineItem` POSTs are ever in flight against the same cart at
 *    once, and the LAST successful response is the authoritative cart (no extra
 *    `getCart` round-trip needed).
 *
 * 3) Same user, multiple tabs
 *    Tabs share the cart id via cookie + storage, so independent flushes from
 *    different tabs would otherwise race in Medusa. We mitigate via a
 *    `BroadcastChannel` (`cart-broadcast.ts`): every tab broadcasts its
 *    post-mutation cart snapshot (and `clearCart` events) and sibling tabs apply
 *    them. This keeps tabs visually consistent and makes stale-state writes
 *    much rarer. A truly simultaneous click in two tabs (within the same 50ms
 *    debounce window, before either snapshot has propagated) can still "lose"
 *    one click because Medusa's `updateLineItem` is set-absolute, not delta —
 *    documented limitation; would require switching to `addLineItem`-style
 *    deltas for the +1 path to fully eliminate.
 *
 * 4) Stock tracking — current configuration
 *    HORO is currently seeded with `manage_inventory: false, allow_backorder: true`
 *    (see `medusa-backend/src/scripts/seed-egypt-catalog.ts`). In that mode
 *    Medusa does NOT reserve or decrement stock at order completion, and returns
 *    do not restore anything (there is nothing to restore). The storefront's
 *    `getProductSizeStockLimit` returns `null` (no limit) and the catalog
 *    reports `inventory_quantity: null`.
 *
 *    To switch HORO into real stock-tracked mode (so checkout decrements and
 *    returns restore automatically through Medusa's built-in workflows), run:
 *      cd medusa-backend
 *      npx medusa exec ./src/scripts/enable-variant-stock-tracking.ts <qty>
 *    The script flips `manage_inventory: true, allow_backorder: false` on every
 *    variant and seeds an inventory level at the default stock location. After
 *    that, `completeCartWorkflow` calls `reserveInventoryStep` and
 *    `confirmReturnRequestWorkflow` calls `adjustInventoryLevelsWorkflow` —
 *    both are Medusa V2 core flows, no custom code needed. The storefront's
 *    `lib/storefront/catalog.ts` already reads
 *    `stocked_quantity − reserved_quantity`, so the next PDP / catalog refresh
 *    reflects the new availability with no client changes.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { trackAddToCart } from '../analytics/events';
import { getProduct, type ProductSizeKey } from '../data/site';
import { medusaAmountToEgp } from '../lib/medusa/egp-amount';
import {
  addLineItem,
  createCart,
  getCart,
  getProductByHandle,
  removeLineItem,
  updateLineItem,
} from '../lib/medusa/client';
import { readProductFromLastCatalogStorage } from '../lib/medusa/catalog';
import { prefetchCheckoutAuxForCart } from '../lib/medusa/checkout-aux-cache';
import { getProductSizeStockLimit } from '../utils/productStock';
import {
  GIFT_WRAP_PRODUCT_HANDLE,
  getCartGiftWrapEgp,
  getGiftWrapLineItem,
  toCartLines,
} from '../lib/medusa/adapters';
import type { MedusaCart, MedusaProduct } from '../lib/medusa/types';
import { findProductVariantById } from '../utils/productVariants';
import { loadMedusaCartId, persistMedusaCartId } from './cart-storage';
import { createCartBroadcast, type CartBroadcast } from './cart-broadcast';
import { createQtyFlushRunner, type QtyFlushRunner } from './qty-flush';
import type { CartMutationResult } from './stock';
import {
  CART_STORAGE_KEY,
  cartLineIdentityKey,
  cartLineKey,
  cartLineWithQty,
  findCartLineIndex,
  findMergeableCartLineIndex,
  orderCartLinesByPreviousOrder,
  removeCartLine,
  updateCartLineQty,
  type CartLine,
  type CartLineIdentity,
} from './types';

export type LastAddedItem = {
  productSlug: string;
  size: ProductSizeKey;
  qty: number;
  productName?: string;
  imageSrc?: string;
  unitPriceEgp?: number;
};

type CartContextValue = {
  /** Medusa store cart id when synced; read-only for pages that prefetch shipping (e.g. cart). */
  medusaCartId: string | null;
  /** True after browser cart storage/cookie has been read. */
  storageReady: boolean;
  /**
   * Seed the cart from a server-rendered Medusa cart so the first paint matches RSC data.
   * Skips the on-mount localStorage load and the auto-sync `getCart` round-trip.
   * Pages should call this once from `useEffect` when they have an `initialCart`.
   */
  seedFromServerCart: (cart: MedusaCart | null | undefined) => void;
  items: CartLine[];
  addItem: (productSlug: string, size: ProductSizeKey, qty?: number, explicitVariantId?: string) => CartMutationResult;
  removeItem: (productSlug: string, size: ProductSizeKey, variantId?: string, lineId?: string) => void;
  setLineQty: (productSlug: string, size: ProductSizeKey, qty: number, variantId?: string, lineId?: string) => CartMutationResult;
  /** Waits for in-flight Medusa mutations (incl. debounced qty) and returns the latest cart snapshot if any. */
  awaitPendingCartSync: () => Promise<MedusaCart | null>;
  clearCart: () => void;
  replaceMedusaCartId: (cartId: string | null) => void;
  totalQty: number;
  subtotalEgp: number;
  /** Medusa cart promotions (store `discount_total`), EGP whole pounds. */
  cartPromotionDiscountEgp: number;
  giftWrapEgp: number;
  giftWrapCatalogPriceEgp: number | null;
  addGiftWrap: () => Promise<void>;
  removeGiftWrap: () => void;
  /** @deprecated Use addToCartToastOpen — kept for gradual migration */
  miniCartOpen: boolean;
  /** @deprecated Use dismissAddToCartToast / showAddToCartToast */
  setMiniCartOpen: (open: boolean) => void;
  addToCartToastOpen: boolean;
  showAddToCartToast: () => void;
  dismissAddToCartToast: () => void;
  lastAddedItem: LastAddedItem | null;
  /** Identity keys for rows with an in-flight quantity update. */
  lineQtySavingKeys: string[];
};

const CartContext = createContext<CartContextValue | null>(null);

const SIZE_SET = new Set<ProductSizeKey>(['XS', 'S', 'M', 'L', 'XL', 'XXL']);

function isValidLine(x: unknown): x is CartLine {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.productSlug === 'string' &&
    typeof o.size === 'string' &&
    SIZE_SET.has(o.size as ProductSizeKey) &&
    typeof o.qty === 'number' &&
    Number.isFinite(o.qty) &&
    o.qty > 0 &&
    Number.isInteger(o.qty)
  );
}

function loadItems(): CartLine[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidLine);
  } catch {
    return [];
  }
}

function persistItems(items: CartLine[]) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
}

type GiftWrapOffer = {
  priceEgp: number | null;
  variantId: string | null;
};

function getMedusaProductPriceEgp(product: Pick<MedusaProduct, 'variants'> | null | undefined): number | null {
  const raw =
    product?.variants?.[0]?.calculated_price?.calculated_amount ??
    product?.variants?.[0]?.prices?.find((price) => price.currency_code.toLowerCase() === 'egp')?.amount;

  return typeof raw === 'number' ? medusaAmountToEgp(raw) : null;
}

const QTY_DEBOUNCE_MS = 50;
const MAX_CART_LINE_QTY = 99;

type PendingQtyUpdate = {
  identity: CartLineIdentity;
  lineId: string;
  qty: number;
};

function applyPendingQtyToCartLines(lines: CartLine[], pendingUpdates: PendingQtyUpdate[]): CartLine[] {
  if (pendingUpdates.length === 0) return lines;

  return lines.map((line) => {
    const pending = pendingUpdates.find((entry) => {
      if (line.lineId) return entry.lineId === line.lineId;
      return cartLineKey(line) === cartLineKey(entry.identity);
    });
    return pending ? cartLineWithQty(line, pending.qty) : line;
  });
}

function normalizedPositiveQty(qty: number): number {
  if (!Number.isFinite(qty)) return 1;
  return Math.max(1, Math.floor(qty));
}

function okCartMutation(qty: number, limit: number | null): CartMutationResult {
  return { ok: true, qty, limit };
}

function blockedCartMutation(limit: number | null, currentQty: number, requestedQty: number): CartMutationResult {
  return {
    ok: false,
    reason: limit === 0 ? 'out_of_stock' : limit === null ? 'unavailable' : 'stock_limit',
    limit,
    currentQty,
    requestedQty,
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [giftWrapEgp, setGiftWrapEgpState] = useState(0);
  const [giftWrapCatalogPriceEgp, setGiftWrapCatalogPriceEgp] = useState<number | null>(null);
  const [medusaCartId, setMedusaCartId] = useState<string | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  const [addToCartToastOpen, setAddToCartToastOpen] = useState(false);
  const showAddToCartToast = useCallback(() => setAddToCartToastOpen(true), []);
  const dismissAddToCartToast = useCallback(() => setAddToCartToastOpen(false), []);
  const setMiniCartOpen = useCallback((open: boolean) => {
    if (open) setAddToCartToastOpen(true);
    else setAddToCartToastOpen(false);
  }, []);
  const miniCartOpen = addToCartToastOpen;
  const [lastAddedItem, setLastAddedItem] = useState<LastAddedItem | null>(null);
  const [lineQtySavingKeys, setLineQtySavingKeys] = useState<string[]>([]);
  const [cartPromotionDiscountEgp, setCartPromotionDiscountEgp] = useState(0);
  const giftWrapOfferPromiseRef = useRef<Promise<GiftWrapOffer> | null>(null);
  /** Monotonic counter incremented on clearCart to invalidate in-flight syncs. */
  const cartGenerationRef = useRef(0);
  /** True once a server-rendered cart has seeded the provider. Skips the next storage load + auto-sync. */
  const seededRef = useRef(false);
  /** Skip exactly one auto-sync after seedFromServerCart sets the medusaCartId. */
  const skipNextAutoSyncRef = useRef(false);
  const medusaCartIdRef = useRef<string | null>(null);
  /** Stable ref to the latest items state — used inside callbacks to avoid stale closures. */
  const itemsRef = useRef<CartLine[]>(items);
  itemsRef.current = items;
  /** Latest cart returned from a successful mutation (for checkout refresh hints). */
  const lastServerCartRef = useRef<MedusaCart | null>(null);
  const pendingOpsRef = useRef(new Set<Promise<unknown>>());
  const pendingQtyByKeyRef = useRef(new Map<string, PendingQtyUpdate>());
  const flushingQtyKeysRef = useRef(new Set<string>());
  /** Store as `number` so tsc stays compatible when Node typings widen `setTimeout` return type. */
  const qtyFlushTimerRef = useRef<number | null>(null);
  /**
   * Single-flight + serial-write flush runner. See `qty-flush.ts` for the full
   * invariants. Created once per provider; closed-over refs are mutated above so
   * the runner always reads the latest cart id / generation / pending map without
   * requiring the runner to be re-created.
   */
  const qtyFlushRunnerRef = useRef<QtyFlushRunner | null>(null);
  /**
   * Cross-tab cart sync. When the same user has multiple tabs open they share
   * the same Medusa cart id, so each tab broadcasts its post-mutation cart
   * snapshot and other tabs apply it. Different users have entirely separate
   * carts, so this channel does not leak between sessions. See
   * `cart-broadcast.ts` for the full rationale.
   */
  const cartBroadcastRef = useRef<CartBroadcast | null>(null);
  /** Set while applying a snapshot from another tab; suppresses re-broadcasting (would be redundant). */
  const inRemoteApplyRef = useRef(false);

  const refreshQtySavingState = useCallback(() => {
    const keys = new Set<string>([
      ...pendingQtyByKeyRef.current.keys(),
      ...flushingQtyKeysRef.current.keys(),
    ]);
    setLineQtySavingKeys([...keys]);
  }, []);

  const applyCartFromResponse = useCallback((cart: MedusaCart, generationBefore: number) => {
    if (cartGenerationRef.current !== generationBefore) return;
    if (cart.completed_at) return;
    lastServerCartRef.current = cart;
    const serverLines = toCartLines(cart);
    const pendingQtyUpdates = [...pendingQtyByKeyRef.current.values()];
    setItems((current) => {
      return applyPendingQtyToCartLines(
        orderCartLinesByPreviousOrder(serverLines, current),
        pendingQtyUpdates,
      );
    });
    const nextGiftWrapEgp = getCartGiftWrapEgp(cart);
    setGiftWrapEgpState(nextGiftWrapEgp);
    if (nextGiftWrapEgp > 0) {
      setGiftWrapCatalogPriceEgp((current) => current ?? nextGiftWrapEgp);
    }
    setCartPromotionDiscountEgp(
      typeof cart.discount_total === 'number' && cart.discount_total > 0
        ? medusaAmountToEgp(cart.discount_total)
        : 0,
    );
    medusaCartIdRef.current = cart.id;
    setMedusaCartId(cart.id);
    // Broadcast to sibling tabs unless we are *applying* an inbound broadcast
    // (would be a redundant round-trip; BroadcastChannel doesn't echo to the
    // origin so there is no infinite-loop risk, but we still avoid the work).
    if (!inRemoteApplyRef.current) {
      cartBroadcastRef.current?.broadcastSnapshot(cart);
    }
  }, []);

  const seedFromServerCart = useCallback((cart: MedusaCart | null | undefined) => {
    if (!cart || cart.completed_at) return;
    if (seededRef.current) return;
    seededRef.current = true;
    skipNextAutoSyncRef.current = true;
    applyCartFromResponse(cart, cartGenerationRef.current);
    persistMedusaCartId(cart.id);
    setStorageReady(true);
  }, [applyCartFromResponse]);

  const trackOp = useCallback((p: Promise<unknown>) => {
    pendingOpsRef.current.add(p);
    void p.finally(() => {
      pendingOpsRef.current.delete(p);
    });
  }, []);

  /** Clear stale cart ID when Medusa returns 404 so next operation creates a fresh cart. */
  const clearStaleCartIf404 = useCallback((err: unknown, generation: number) => {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('(404)') && cartGenerationRef.current === generation) {
      // Synchronously wipe storage + cookie so a sibling tab / next mount can't rehydrate
      // the dead cart id before our React state update commits.
      medusaCartIdRef.current = null;
      persistMedusaCartId(null);
      setMedusaCartId(null);
    }
  }, []);

  const syncFromMedusaCart = useCallback(async (cartId: string) => {
    const generation = cartGenerationRef.current;
    try {
      const { cart } = await getCart(cartId);
      // If the cart was cleared while this fetch was in flight, discard the result
      // so we don't accidentally re-set the medusaCartId after clearCart().
      if (cartGenerationRef.current !== generation) return;
      applyCartFromResponse(cart, generation);
    } catch (err: unknown) {
      // If the cart no longer exists (404), clear the stale ID so the next
      // cart operation creates a fresh cart instead of repeatedly hitting 404.
      clearStaleCartIf404(err, generation);
    }
  }, [applyCartFromResponse, clearStaleCartIf404]);

  // Lazily build the flush runner once. Closed-over refs (above) are mutated as
  // state changes, so the runner always reads the latest cart id / generation /
  // pending map without requiring the runner to be re-created.
  if (!qtyFlushRunnerRef.current) {
    qtyFlushRunnerRef.current = createQtyFlushRunner({
      drainPending: () => {
        const captured = new Map(pendingQtyByKeyRef.current);
        pendingQtyByKeyRef.current.clear();
        return captured;
      },
      hasPending: () => pendingQtyByKeyRef.current.size > 0,
      getCartId: () => medusaCartIdRef.current,
      getGeneration: () => cartGenerationRef.current,
      updateLineItem: (cartId, lineId, qty) => updateLineItem(cartId, lineId, qty),
      syncCart: (cartId) => syncFromMedusaCart(cartId),
      applyCart: (cart, generation) => applyCartFromResponse(cart, generation),
      flushingKeys: flushingQtyKeysRef.current,
      refreshSavingState: () => refreshQtySavingState(),
      on404: (err, generation) => clearStaleCartIf404(err, generation),
    });
  }

  const flushPendingQtyUpdates = useCallback(async () => {
    await qtyFlushRunnerRef.current!.run();
  }, []);

  const scheduleQtyFlush = useCallback(() => {
    if (qtyFlushTimerRef.current !== null) {
      window.clearTimeout(qtyFlushTimerRef.current);
    }
    refreshQtySavingState();
    qtyFlushTimerRef.current = window.setTimeout(() => {
      qtyFlushTimerRef.current = null;
      refreshQtySavingState();
      void flushPendingQtyUpdates();
    }, QTY_DEBOUNCE_MS) as unknown as number;
  }, [flushPendingQtyUpdates, refreshQtySavingState]);

  const awaitPendingCartSync = useCallback(async (): Promise<MedusaCart | null> => {
    if (qtyFlushTimerRef.current !== null) {
      window.clearTimeout(qtyFlushTimerRef.current);
      qtyFlushTimerRef.current = null;
    }
    await flushPendingQtyUpdates();
    const ops = [...pendingOpsRef.current];
    if (ops.length > 0) {
      await Promise.all(ops);
    }
    return lastServerCartRef.current;
  }, [flushPendingQtyUpdates]);

  useEffect(() => {
    // Child page useEffects (e.g. Cart / Checkout `seedFromServerCart`) run before this
    // parent effect, so a seeded provider already has authoritative state and we skip
    // the localStorage round-trip entirely.
    if (seededRef.current) {
      setStorageReady(true);
      return;
    }
    setItems(loadItems());
    setMedusaCartId(loadMedusaCartId());
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!medusaCartId) return;
    if (skipNextAutoSyncRef.current) {
      skipNextAutoSyncRef.current = false;
      return;
    }
    void syncFromMedusaCart(medusaCartId);
  }, [medusaCartId, syncFromMedusaCart]);

  useEffect(() => {
    if (!storageReady) return;
    persistItems(items);
  }, [items, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    persistMedusaCartId(medusaCartId);
  }, [medusaCartId, storageReady]);

  useEffect(() => {
    medusaCartIdRef.current = medusaCartId;
  }, [medusaCartId]);

  useEffect(() => {
    if (!miniCartOpen || !medusaCartId) return;
    prefetchCheckoutAuxForCart(medusaCartId);
  }, [miniCartOpen, medusaCartId]);

  const ensureMedusaCartId = useCallback(async () => {
    if (medusaCartId) return medusaCartId;
    const created = await createCart();
    medusaCartIdRef.current = created.cart.id;
    setMedusaCartId(created.cart.id);
    setGiftWrapEgpState(getCartGiftWrapEgp(created.cart));
    return created.cart.id;
  }, [medusaCartId]);

  const resolveVariantId = useCallback((productSlug: string, size: ProductSizeKey) => {
    return getProduct(productSlug)?.variantsBySize?.[size]?.id ?? null;
  }, []);

  const resolveGiftWrapOffer = useCallback(async () => {
    if (!giftWrapOfferPromiseRef.current) {
      giftWrapOfferPromiseRef.current = getProductByHandle(GIFT_WRAP_PRODUCT_HANDLE)
        .then((response) => {
          const product = response?.product;
          // Pick the first variant that has a calculated price — strong signal
          // the variant is published and can be added to a cart.
          const usableVariant = product?.variants?.find(
            (v) => v.calculated_price?.calculated_amount != null,
          ) ?? product?.variants?.[0];
          return {
            priceEgp: getMedusaProductPriceEgp(product),
            variantId: usableVariant?.id ?? null,
          };
        })
        .catch(() => ({ priceEgp: null, variantId: null }));
    }

    return giftWrapOfferPromiseRef.current;
  }, []);

  useEffect(() => {
    void resolveGiftWrapOffer().then((offer) => {
      if (typeof offer.priceEgp === 'number') {
        setGiftWrapCatalogPriceEgp(offer.priceEgp);
      }
    });
  }, [resolveGiftWrapOffer]);

  const addItem = useCallback((productSlug: string, size: ProductSizeKey, qty = 1, explicitVariantId?: string): CartMutationResult => {
    const product = getProduct(productSlug) ?? readProductFromLastCatalogStorage(productSlug);
    if (!product || qty < 1) {
      return blockedCartMutation(null, 0, qty < 1 ? 0 : normalizedPositiveQty(qty));
    }

    const requestedAdd = normalizedPositiveQty(qty);
    const variant = explicitVariantId
      ? findProductVariantById(product, explicitVariantId)
      : product.variantsBySize?.[size];
    if (explicitVariantId && !variant) {
      return blockedCartMutation(null, 0, requestedAdd);
    }
    const unitPriceEgp = variant?.priceEgp ?? product.priceEgp;
    const variantId = variant?.id ?? explicitVariantId;
    const stockLimit = getProductSizeStockLimit(product, size, variantId);
    const currentItems = itemsRef.current;
    const currentIndex = findMergeableCartLineIndex(currentItems, { productSlug, size, variantId: variantId ?? undefined });
    const currentQty = currentIndex >= 0 ? currentItems[currentIndex].qty : 0;
    const requestedQty = currentQty + requestedAdd;

    if (stockLimit !== null && Math.min(MAX_CART_LINE_QTY, requestedQty) > stockLimit) {
      return blockedCartMutation(stockLimit, currentQty, requestedQty);
    }

    if (currentQty >= MAX_CART_LINE_QTY) {
      return blockedCartMutation(MAX_CART_LINE_QTY, currentQty, requestedQty);
    }

    const add = Math.min(requestedAdd, MAX_CART_LINE_QTY - currentQty);

    setItems((prev) => {
      const idx = findMergeableCartLineIndex(prev, { productSlug, size, variantId: variantId ?? undefined });
      if (idx >= 0) {
        const next = [...prev];
        const nextQty = Math.min(
          MAX_CART_LINE_QTY,
          stockLimit === null ? next[idx].qty + add : Math.min(stockLimit, next[idx].qty + add),
        );
        next[idx] = {
          ...next[idx],
          imageSrc: next[idx].imageSrc ?? product.media?.main ?? product.thumbnail ?? undefined,
          productName: next[idx].productName ?? product.name,
          qty: nextQty,
          unitPriceEgp: next[idx].unitPriceEgp ?? unitPriceEgp,
          variantId: next[idx].variantId ?? variantId ?? undefined,
        };
        return next;
      }

      return [
        ...prev,
        {
          imageSrc: product.media?.main ?? product.thumbnail ?? undefined,
          productName: product.name,
          productSlug,
          qty: stockLimit === null ? add : Math.min(stockLimit, add),
          size,
          unitPriceEgp,
          variantId: variantId ?? undefined,
        },
      ];
    });

    /* Track the last added item for the mini-cart drawer */
    setLastAddedItem({
      productSlug,
      size,
      qty: add,
      productName: product.name,
      imageSrc: product.media?.main ?? product.thumbnail ?? undefined,
      unitPriceEgp,
    });

    queueMicrotask(() => trackAddToCart(product, add, size));

    const p = (async () => {
      const gen = cartGenerationRef.current;
      let cartId: string | null = null;
      try {
        cartId = await ensureMedusaCartId();
        const resolvedVariantId = explicitVariantId ?? resolveVariantId(productSlug, size);
        if (!resolvedVariantId) return;
        const { cart } = await addLineItem(cartId, resolvedVariantId, add);
        if (cartGenerationRef.current !== gen) return;
        applyCartFromResponse(cart, gen);
      } catch (err: unknown) {
        clearStaleCartIf404(err, gen);
        if (cartId) {
          await syncFromMedusaCart(cartId);
        }
      }
    })();
    trackOp(p);
    return okCartMutation(currentQty + add, stockLimit);
  }, [applyCartFromResponse, clearStaleCartIf404, ensureMedusaCartId, resolveVariantId, syncFromMedusaCart, trackOp]);

  const removeItem = useCallback(
    (productSlug: string, size: ProductSizeKey, variantId?: string, lineId?: string) => {
      const identity = { productSlug, size, variantId, lineId };
      const currentItems = itemsRef.current;
      const line = currentItems[findCartLineIndex(currentItems, identity)];
      const medusaLineId = line?.lineId ?? lineId;
      pendingQtyByKeyRef.current.delete(cartLineIdentityKey({ ...identity, lineId: medusaLineId }));
      refreshQtySavingState();
      setItems((prev) => removeCartLine(prev, identity));
      const activeCartId = medusaCartIdRef.current;
      if (!medusaLineId || !activeCartId) return;
      const p = (async () => {
        const gen = cartGenerationRef.current;
        try {
          const { cart } = await removeLineItem(activeCartId, medusaLineId);
          if (cartGenerationRef.current !== gen) return;
          applyCartFromResponse(cart, gen);
        } catch (err: unknown) {
          // Keep optimistic removal.
          clearStaleCartIf404(err, gen);
        }
      })();
      trackOp(p);
    },
    [applyCartFromResponse, clearStaleCartIf404, refreshQtySavingState, trackOp],
  );

  const setLineQty = useCallback(
    (productSlug: string, size: ProductSizeKey, qty: number, variantId?: string, lineId?: string): CartMutationResult => {
      const identity = { productSlug, size, variantId, lineId };
      const currentItems = itemsRef.current;
      const line = currentItems[findCartLineIndex(currentItems, identity)];
      const medusaLineId = line?.lineId ?? lineId;
      const pendingKey = cartLineIdentityKey({ ...identity, lineId: medusaLineId });
      const activeCartId = medusaCartIdRef.current;
      if (qty < 1) {
        pendingQtyByKeyRef.current.delete(pendingKey);
        refreshQtySavingState();
        if (qtyFlushTimerRef.current !== null) {
          window.clearTimeout(qtyFlushTimerRef.current);
          qtyFlushTimerRef.current = null;
          if (pendingQtyByKeyRef.current.size > 0) {
            scheduleQtyFlush();
          } else {
            refreshQtySavingState();
          }
        }
        setItems((prev) => removeCartLine(prev, identity));
        if (medusaLineId && activeCartId) {
          const p = (async () => {
            const gen = cartGenerationRef.current;
            try {
              const { cart } = await removeLineItem(activeCartId, medusaLineId);
              if (cartGenerationRef.current !== gen) return;
              applyCartFromResponse(cart, gen);
            } catch (err: unknown) {
              /* keep optimistic removal */
              clearStaleCartIf404(err, gen);
            }
          })();
          trackOp(p);
        }
        return okCartMutation(0, null);
      }

      if (!line) {
        return blockedCartMutation(null, 0, normalizedPositiveQty(qty));
      }

      const product = getProduct(productSlug) ?? readProductFromLastCatalogStorage(productSlug);
      const stockLimit = getProductSizeStockLimit(product, size, variantId ?? line.variantId);
      let nextQty = Math.min(MAX_CART_LINE_QTY, normalizedPositiveQty(qty));

      if (stockLimit !== null && nextQty > stockLimit) {
        if (line.qty > stockLimit && nextQty < line.qty) {
          nextQty = stockLimit;
        } else {
          return blockedCartMutation(stockLimit, line.qty, nextQty);
        }
      }

      if (nextQty < 1) {
        pendingQtyByKeyRef.current.delete(pendingKey);
        refreshQtySavingState();
        setItems((prev) => removeCartLine(prev, identity));
        if (medusaLineId && activeCartId) {
          const p = (async () => {
            const gen = cartGenerationRef.current;
            try {
              const { cart } = await removeLineItem(activeCartId, medusaLineId);
              if (cartGenerationRef.current !== gen) return;
              applyCartFromResponse(cart, gen);
            } catch (err: unknown) {
              clearStaleCartIf404(err, gen);
            }
          })();
          trackOp(p);
        }
        return okCartMutation(0, stockLimit);
      }

      setItems((prev) => updateCartLineQty(prev, identity, nextQty));
      if (medusaLineId && activeCartId) {
        pendingQtyByKeyRef.current.set(pendingKey, {
          identity: { ...identity, lineId: medusaLineId },
          lineId: medusaLineId,
          qty: nextQty,
        });
        scheduleQtyFlush();
      }
      return okCartMutation(nextQty, stockLimit);
    },
    [applyCartFromResponse, clearStaleCartIf404, refreshQtySavingState, scheduleQtyFlush, trackOp],
  );

  const addGiftWrap = useCallback(async () => {
    if (giftWrapEgp > 0) return;
    const previousGiftWrap = giftWrapEgp;

    const p = (async () => {
      const gen = cartGenerationRef.current;
      try {
        const cartId = await ensureMedusaCartId();
        const { cart } = await getCart(cartId);
        const existingGiftWrapLine = getGiftWrapLineItem(cart);

        if (existingGiftWrapLine?.id) {
          if (existingGiftWrapLine.quantity !== 1) {
            const { cart: next } = await updateLineItem(cartId, existingGiftWrapLine.id, 1);
            if (cartGenerationRef.current === gen) applyCartFromResponse(next, gen);
          } else if (cartGenerationRef.current === gen) {
            applyCartFromResponse(cart, gen);
          }
          return;
        }

        const offer = await resolveGiftWrapOffer();
        if (!offer.variantId) {
          throw new Error('Gift wrap variant is not available in Medusa.');
        }

        if (typeof offer.priceEgp === 'number' && offer.priceEgp > 0) {
          setGiftWrapCatalogPriceEgp(offer.priceEgp);
        }

        const { cart: added } = await addLineItem(cartId, offer.variantId, 1);
        if (cartGenerationRef.current === gen) applyCartFromResponse(added, gen);
      } catch (err: unknown) {
        setGiftWrapEgpState(previousGiftWrap);
        clearStaleCartIf404(err, gen);
        // If gift-wrap variant is invalid (400), clear the cached offer so it's re-resolved next time.
        const msg = err instanceof Error ? err.message : '';
        if (msg.includes('(400)')) {
          giftWrapOfferPromiseRef.current = null;
        }
      }
    })();
    trackOp(p);
    return p;
  }, [applyCartFromResponse, clearStaleCartIf404, ensureMedusaCartId, giftWrapEgp, resolveGiftWrapOffer, trackOp]);

  const removeGiftWrap = useCallback(() => {
    if (giftWrapEgp === 0) return;
    const previousGiftWrap = giftWrapEgp;
    setGiftWrapEgpState(0);

    const p = (async () => {
      const gen = cartGenerationRef.current;
      const activeCartId = medusaCartIdRef.current;
      try {
        if (!activeCartId) {
          return;
        }

        const { cart } = await getCart(activeCartId);
        const existingGiftWrapLine = getGiftWrapLineItem(cart);

        if (existingGiftWrapLine?.id) {
          const { cart: next } = await removeLineItem(activeCartId, existingGiftWrapLine.id);
          if (cartGenerationRef.current === gen) applyCartFromResponse(next, gen);
        } else if (cartGenerationRef.current === gen) {
          applyCartFromResponse(cart, gen);
        }
      } catch (err: unknown) {
        setGiftWrapEgpState(previousGiftWrap);
        clearStaleCartIf404(err, gen);
      }
    })();
    trackOp(p);
  }, [applyCartFromResponse, clearStaleCartIf404, giftWrapEgp, trackOp]);

  const clearCart = useCallback(() => {
    // Bump generation so any in-flight syncFromMedusaCart discards its result.
    cartGenerationRef.current += 1;
    pendingQtyByKeyRef.current.clear();
    flushingQtyKeysRef.current.clear();
    if (qtyFlushTimerRef.current !== null) {
      window.clearTimeout(qtyFlushTimerRef.current);
      qtyFlushTimerRef.current = null;
    }
    lastServerCartRef.current = null;
    setItems([]);
    setGiftWrapEgpState(0);
    medusaCartIdRef.current = null;
    setMedusaCartId(null);
    setCartPromotionDiscountEgp(0);
    setLineQtySavingKeys([]);
    // Synchronously wipe localStorage so the stale cart ID can never be
    // re-loaded on a subsequent page mount (React effects are async).
    persistItems([]);
    persistMedusaCartId(null);
    // Mirror the clear to sibling tabs (skip when we're applying an inbound clear).
    if (!inRemoteApplyRef.current) {
      cartBroadcastRef.current?.broadcastClear();
    }
  }, []);

  // Subscribe to sibling-tab cart updates. Runs once on mount; the closed-over
  // refs read above are mutated as state changes, so the handlers always see the
  // latest cart id / generation without re-subscribing.
  useEffect(() => {
    const broadcast = createCartBroadcast({
      onSnapshot: (cart) => {
        // Adopt the sibling's snapshot only when it matches our cart id, or when
        // we don't have one yet (sibling just created a Medusa cart). Otherwise
        // ignore — diverging cart ids across tabs are abnormal and we'd rather
        // surface that via a manual reload than overwrite local state.
        const ours = medusaCartIdRef.current;
        if (ours && cart.id !== ours) return;
        inRemoteApplyRef.current = true;
        try {
          applyCartFromResponse(cart, cartGenerationRef.current);
        } finally {
          inRemoteApplyRef.current = false;
        }
      },
      onClear: () => {
        inRemoteApplyRef.current = true;
        try {
          // Use the public clearCart so all the local wipe steps run, but the
          // re-broadcast is suppressed by the inRemoteApplyRef guard above.
          clearCart();
        } finally {
          inRemoteApplyRef.current = false;
        }
      },
    });
    cartBroadcastRef.current = broadcast;
    return () => {
      broadcast.close();
      cartBroadcastRef.current = null;
    };
  }, [applyCartFromResponse, clearCart]);

  const replaceMedusaCartId = useCallback((cartId: string | null) => {
    medusaCartIdRef.current = cartId;
    setMedusaCartId(cartId);
  }, []);

  const totalQty = useMemo(() => items.reduce((sum, line) => sum + line.qty, 0), [items]);

  const subtotalEgp = useMemo(() => {
    return items.reduce((sum, line) => {
      const product = getProduct(line.productSlug);
      const linePrice =
        line.unitPriceEgp ??
        product?.variantsBySize?.[line.size]?.priceEgp ??
        product?.priceEgp;
      return sum + (linePrice ?? 0) * line.qty;
    }, 0);
  }, [items]);

  const value = useMemo(
    () => ({
      medusaCartId,
      storageReady,
      seedFromServerCart,
      items,
      addItem,
      removeItem,
      setLineQty,
      awaitPendingCartSync,
      clearCart,
      replaceMedusaCartId,
      totalQty,
      subtotalEgp,
      cartPromotionDiscountEgp,
      giftWrapEgp,
      giftWrapCatalogPriceEgp,
      addGiftWrap,
      removeGiftWrap,
      miniCartOpen,
      setMiniCartOpen,
      addToCartToastOpen,
      showAddToCartToast,
      dismissAddToCartToast,
      lastAddedItem,
      lineQtySavingKeys,
    }),
    [
      medusaCartId,
      storageReady,
      seedFromServerCart,
      items,
      addItem,
      removeItem,
      setLineQty,
      awaitPendingCartSync,
      clearCart,
      replaceMedusaCartId,
      totalQty,
      subtotalEgp,
      cartPromotionDiscountEgp,
      giftWrapEgp,
      giftWrapCatalogPriceEgp,
      addGiftWrap,
      removeGiftWrap,
      addToCartToastOpen,
      showAddToCartToast,
      dismissAddToCartToast,
      lastAddedItem,
      lineQtySavingKeys,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
