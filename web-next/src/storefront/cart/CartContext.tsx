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
import {
  GIFT_WRAP_PRODUCT_HANDLE,
  getCartGiftWrapEgp,
  getGiftWrapLineItem,
  toCartLines,
} from '../lib/medusa/adapters';
import type { MedusaCart, MedusaProduct } from '../lib/medusa/types';
import { findProductVariantById } from '../utils/productVariants';
import { persistCartIdCookie, readCartIdFromCookieString } from './cart-cookie';
import {
  CART_STORAGE_KEY,
  MEDUSA_CART_ID_STORAGE_KEY,
  cartLineIdentityKey,
  cartLineKey,
  cartLineWithQty,
  findCartLineIndex,
  findMergeableCartLineIndex,
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
  items: CartLine[];
  addItem: (productSlug: string, size: ProductSizeKey, qty?: number, explicitVariantId?: string) => void;
  removeItem: (productSlug: string, size: ProductSizeKey, variantId?: string, lineId?: string) => void;
  setLineQty: (productSlug: string, size: ProductSizeKey, qty: number, variantId?: string, lineId?: string) => void;
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
  miniCartOpen: boolean;
  setMiniCartOpen: (open: boolean) => void;
  lastAddedItem: LastAddedItem | null;
  /** True while debounced quantity updates are flushing to Medusa. */
  lineQtySaving: boolean;
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

function loadMedusaCartId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const localCartId = localStorage.getItem(MEDUSA_CART_ID_STORAGE_KEY);
    if (localCartId) return localCartId;
  } catch {
    /* fall through to cookie */
  }
  return readCartIdFromCookieString(document.cookie);
}

function persistMedusaCartId(cartId: string | null) {
  if (typeof window === 'undefined') return;
  persistCartIdCookie(cartId);
  try {
    if (!cartId) {
      localStorage.removeItem(MEDUSA_CART_ID_STORAGE_KEY);
      return;
    }
    localStorage.setItem(MEDUSA_CART_ID_STORAGE_KEY, cartId);
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

const QTY_DEBOUNCE_MS = 300;

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

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [giftWrapEgp, setGiftWrapEgpState] = useState(0);
  const [giftWrapCatalogPriceEgp, setGiftWrapCatalogPriceEgp] = useState<number | null>(null);
  const [medusaCartId, setMedusaCartId] = useState<string | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  const [miniCartOpen, setMiniCartOpen] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState<LastAddedItem | null>(null);
  const [lineQtySaving, setLineQtySaving] = useState(false);
  const [cartPromotionDiscountEgp, setCartPromotionDiscountEgp] = useState(0);
  const giftWrapOfferPromiseRef = useRef<Promise<GiftWrapOffer> | null>(null);
  /** Monotonic counter incremented on clearCart to invalidate in-flight syncs. */
  const cartGenerationRef = useRef(0);
  const medusaCartIdRef = useRef<string | null>(null);
  /** Latest cart returned from a successful mutation (for checkout refresh hints). */
  const lastServerCartRef = useRef<MedusaCart | null>(null);
  const pendingOpsRef = useRef(new Set<Promise<unknown>>());
  const pendingQtyByKeyRef = useRef(new Map<string, PendingQtyUpdate>());
  /** Store as `number` so tsc stays compatible when Node typings widen `setTimeout` return type. */
  const qtyFlushTimerRef = useRef<number | null>(null);
  const flushPendingQtyUpdatesInternalRef = useRef<() => Promise<void>>(async () => {});

  const applyCartFromResponse = useCallback((cart: MedusaCart, generationBefore: number) => {
    if (cartGenerationRef.current !== generationBefore) return;
    if (cart.completed_at) return;
    lastServerCartRef.current = cart;
    setItems(applyPendingQtyToCartLines(toCartLines(cart), [...pendingQtyByKeyRef.current.values()]));
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
  }, []);

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

  const flushPendingQtyUpdatesInternal = useCallback(async () => {
    try {
      for (;;) {
        const pending = new Map(pendingQtyByKeyRef.current);
        pendingQtyByKeyRef.current.clear();
        if (pending.size === 0) break;

        const cartId = medusaCartIdRef.current;
        if (!cartId) break;

        const gen = cartGenerationRef.current;
        const byLineId = new Map<string, number>();
        for (const { lineId, qty } of pending.values()) {
          byLineId.set(lineId, qty);
        }

        let hadError = false;
        await Promise.all(
          [...byLineId.entries()].map(async ([lineId, qty]) => {
            try {
              await updateLineItem(cartId, lineId, qty);
            } catch {
              hadError = true;
            }
          }),
        );

        if (hadError) {
          await syncFromMedusaCart(cartId);
          break;
        }

        try {
          const { cart } = await getCart(cartId);
          if (cartGenerationRef.current === gen) {
            applyCartFromResponse(cart, gen);
          }
        } catch {
          await syncFromMedusaCart(cartId);
        }

        if (pendingQtyByKeyRef.current.size === 0) break;
      }
    } finally {
      setLineQtySaving(pendingQtyByKeyRef.current.size > 0 || qtyFlushTimerRef.current !== null);
    }
  }, [applyCartFromResponse, syncFromMedusaCart]);

  flushPendingQtyUpdatesInternalRef.current = flushPendingQtyUpdatesInternal;

  const scheduleQtyFlush = useCallback(() => {
    if (qtyFlushTimerRef.current !== null) {
      window.clearTimeout(qtyFlushTimerRef.current);
    }
    setLineQtySaving(true);
    qtyFlushTimerRef.current = window.setTimeout(() => {
      qtyFlushTimerRef.current = null;
      void flushPendingQtyUpdatesInternalRef.current();
    }, QTY_DEBOUNCE_MS) as unknown as number;
  }, []);

  const awaitPendingCartSync = useCallback(async (): Promise<MedusaCart | null> => {
    if (qtyFlushTimerRef.current !== null) {
      window.clearTimeout(qtyFlushTimerRef.current);
      qtyFlushTimerRef.current = null;
      await flushPendingQtyUpdatesInternalRef.current();
    } else {
      await flushPendingQtyUpdatesInternalRef.current();
    }
    const ops = [...pendingOpsRef.current];
    if (ops.length > 0) {
      await Promise.all(ops);
    }
    return lastServerCartRef.current;
  }, []);

  useEffect(() => {
    setItems(loadItems());
    setMedusaCartId(loadMedusaCartId());
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!medusaCartId) return;
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

  const addItem = useCallback((productSlug: string, size: ProductSizeKey, qty = 1, explicitVariantId?: string) => {
    const product = getProduct(productSlug) ?? readProductFromLastCatalogStorage(productSlug);
    if (!product || qty < 1) return;
    const add = Math.min(qty, 99);
    const variant = explicitVariantId
      ? findProductVariantById(product, explicitVariantId)
      : product.variantsBySize?.[size];
    if (explicitVariantId && !variant) return;
    const unitPriceEgp = variant?.priceEgp ?? product.priceEgp;
    const variantId = variant?.id ?? explicitVariantId;

    setItems((prev) => {
      const idx = findMergeableCartLineIndex(prev, { productSlug, size, variantId: variantId ?? undefined });
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          imageSrc: next[idx].imageSrc ?? product.media?.main ?? product.thumbnail ?? undefined,
          productName: next[idx].productName ?? product.name,
          qty: Math.min(99, next[idx].qty + add),
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
          qty: add,
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
      try {
        const cartId = await ensureMedusaCartId();
        const resolvedVariantId = explicitVariantId ?? resolveVariantId(productSlug, size);
        if (!resolvedVariantId) return;
        const { cart } = await addLineItem(cartId, resolvedVariantId, add);
        if (cartGenerationRef.current !== gen) return;
        applyCartFromResponse(cart, gen);
      } catch (err: unknown) {
        // Keep optimistic cart updates when Medusa call fails.
        clearStaleCartIf404(err, gen);
      }
    })();
    trackOp(p);
  }, [applyCartFromResponse, clearStaleCartIf404, ensureMedusaCartId, resolveVariantId, trackOp]);

  const removeItem = useCallback(
    (productSlug: string, size: ProductSizeKey, variantId?: string, lineId?: string) => {
      const identity = { productSlug, size, variantId, lineId };
      const line = items[findCartLineIndex(items, identity)];
      const medusaLineId = line?.lineId ?? lineId;
      pendingQtyByKeyRef.current.delete(cartLineIdentityKey({ ...identity, lineId: medusaLineId }));
      setItems((prev) => removeCartLine(prev, identity));
      const activeCartId = medusaCartIdRef.current ?? medusaCartId;
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
    [applyCartFromResponse, clearStaleCartIf404, items, medusaCartId, trackOp],
  );

  const setLineQty = useCallback(
    (productSlug: string, size: ProductSizeKey, qty: number, variantId?: string, lineId?: string) => {
      const identity = { productSlug, size, variantId, lineId };
      const line = items[findCartLineIndex(items, identity)];
      const medusaLineId = line?.lineId ?? lineId;
      const pendingKey = cartLineIdentityKey({ ...identity, lineId: medusaLineId });
      const activeCartId = medusaCartIdRef.current ?? medusaCartId;
      if (qty < 1) {
        pendingQtyByKeyRef.current.delete(pendingKey);
        if (qtyFlushTimerRef.current !== null) {
          window.clearTimeout(qtyFlushTimerRef.current);
          qtyFlushTimerRef.current = null;
          if (pendingQtyByKeyRef.current.size > 0) {
            scheduleQtyFlush();
          } else {
            setLineQtySaving(false);
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
        return;
      }
      const nextQty = Math.min(99, Math.floor(qty));
      setItems((prev) => updateCartLineQty(prev, identity, nextQty));
      if (medusaLineId && activeCartId) {
        pendingQtyByKeyRef.current.set(pendingKey, {
          identity: { ...identity, lineId: medusaLineId },
          lineId: medusaLineId,
          qty: nextQty,
        });
        scheduleQtyFlush();
      }
    },
    [applyCartFromResponse, clearStaleCartIf404, items, medusaCartId, scheduleQtyFlush, trackOp],
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
      try {
        if (!medusaCartId) {
          return;
        }

        const { cart } = await getCart(medusaCartId);
        const existingGiftWrapLine = getGiftWrapLineItem(cart);

        if (existingGiftWrapLine?.id) {
          const { cart: next } = await removeLineItem(medusaCartId, existingGiftWrapLine.id);
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
  }, [applyCartFromResponse, clearStaleCartIf404, giftWrapEgp, medusaCartId, trackOp]);

  const clearCart = useCallback(() => {
    // Bump generation so any in-flight syncFromMedusaCart discards its result.
    cartGenerationRef.current += 1;
    pendingQtyByKeyRef.current.clear();
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
    setLineQtySaving(false);
    // Synchronously wipe localStorage so the stale cart ID can never be
    // re-loaded on a subsequent page mount (React effects are async).
    persistItems([]);
    persistMedusaCartId(null);
  }, []);

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
      lastAddedItem,
      lineQtySaving,
    }),
    [
      medusaCartId,
      storageReady,
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
      lastAddedItem,
      lineQtySaving,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
