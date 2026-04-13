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
import {
  addLineItem,
  createCart,
  getCart,
  getProductByHandle,
  removeLineItem,
  updateLineItem,
} from '../lib/medusa/client';
import {
  GIFT_WRAP_PRODUCT_HANDLE,
  getCartGiftWrapEgp,
  getGiftWrapLineItem,
  toCartLines,
} from '../lib/medusa/adapters';
import type { MedusaProduct } from '../lib/medusa/types';
import { CART_STORAGE_KEY, MEDUSA_CART_ID_STORAGE_KEY, cartLineKey, type CartLine } from './types';

export type LastAddedItem = {
  productSlug: string;
  size: ProductSizeKey;
  qty: number;
  productName?: string;
  imageSrc?: string;
  unitPriceEgp?: number;
};

type CartContextValue = {
  items: CartLine[];
  addItem: (productSlug: string, size: ProductSizeKey, qty?: number) => void;
  removeItem: (productSlug: string, size: ProductSizeKey) => void;
  setLineQty: (productSlug: string, size: ProductSizeKey, qty: number) => void;
  clearCart: () => void;
  replaceMedusaCartId: (cartId: string | null) => void;
  totalQty: number;
  subtotalEgp: number;
  giftWrapEgp: number;
  giftWrapCatalogPriceEgp: number | null;
  addGiftWrap: () => void;
  removeGiftWrap: () => void;
  miniCartOpen: boolean;
  setMiniCartOpen: (open: boolean) => void;
  lastAddedItem: LastAddedItem | null;
};

const CartContext = createContext<CartContextValue | null>(null);

const SIZE_SET = new Set<ProductSizeKey>(['S', 'M', 'L', 'XL', 'XXL']);

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
    return localStorage.getItem(MEDUSA_CART_ID_STORAGE_KEY);
  } catch {
    return null;
  }
}

function persistMedusaCartId(cartId: string | null) {
  if (typeof window === 'undefined') return;
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
  const priceCents =
    product?.variants?.[0]?.calculated_price?.calculated_amount ??
    product?.variants?.[0]?.prices?.find((price) => price.currency_code.toLowerCase() === 'egp')?.amount;

  return typeof priceCents === 'number' ? Math.round(priceCents / 100) : null;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [giftWrapEgp, setGiftWrapEgpState] = useState(0);
  const [giftWrapCatalogPriceEgp, setGiftWrapCatalogPriceEgp] = useState<number | null>(null);
  const [medusaCartId, setMedusaCartId] = useState<string | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  const [miniCartOpen, setMiniCartOpen] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState<LastAddedItem | null>(null);
  const giftWrapOfferPromiseRef = useRef<Promise<GiftWrapOffer> | null>(null);
  /** Monotonic counter incremented on clearCart to invalidate in-flight syncs. */
  const cartGenerationRef = useRef(0);

  const syncFromMedusaCart = useCallback(async (cartId: string) => {
    const generation = cartGenerationRef.current;
    try {
      const { cart } = await getCart(cartId);
      // If the cart was cleared while this fetch was in flight, discard the result
      // so we don't accidentally re-set the medusaCartId after clearCart().
      if (cartGenerationRef.current !== generation) return;
      // Also skip completed carts – they belong to a placed order.
      if (cart.completed_at) return;
      setItems(toCartLines(cart));
      const nextGiftWrapEgp = getCartGiftWrapEgp(cart);
      setGiftWrapEgpState(nextGiftWrapEgp);
      if (nextGiftWrapEgp > 0) {
        setGiftWrapCatalogPriceEgp((current) => current ?? nextGiftWrapEgp);
      }
      setMedusaCartId(cart.id);
    } catch {
      // Keep local fallback state if backend is unavailable.
    }
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

  const ensureMedusaCartId = useCallback(async () => {
    if (medusaCartId) return medusaCartId;
    const created = await createCart();
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
        .then((response) => ({
          priceEgp: getMedusaProductPriceEgp(response?.product),
          variantId: response?.product.variants?.[0]?.id ?? null,
        }))
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

  const addItem = useCallback((productSlug: string, size: ProductSizeKey, qty = 1) => {
    const product = getProduct(productSlug);
    if (!product || qty < 1) return;
    const add = Math.min(qty, 99);
    const variant = product.variantsBySize?.[size];
    const unitPriceEgp = variant?.priceEgp ?? product.priceEgp;
    const variantId = variant?.id;

    setItems((prev) => {
      const key = cartLineKey({ productSlug, size });
      const idx = prev.findIndex((line) => cartLineKey(line) === key);
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

    void (async () => {
      try {
        const cartId = await ensureMedusaCartId();
        const resolvedVariantId = resolveVariantId(productSlug, size);
        if (!resolvedVariantId) return;
        await addLineItem(cartId, resolvedVariantId, add);
        await syncFromMedusaCart(cartId);
      } catch {
        // Keep optimistic cart updates when Medusa call fails.
      }
    })();
  }, [ensureMedusaCartId, resolveVariantId, syncFromMedusaCart]);

  const removeItem = useCallback((productSlug: string, size: ProductSizeKey) => {
    const line = items.find((item) => cartLineKey(item) === cartLineKey({ productSlug, size }));
    setItems((prev) => prev.filter((item) => cartLineKey(item) !== cartLineKey({ productSlug, size })));
    if (!line?.lineId || !medusaCartId) return;
    void (async () => {
      try {
        await removeLineItem(medusaCartId, line.lineId!);
        await syncFromMedusaCart(medusaCartId);
      } catch {
        // Keep optimistic removal.
      }
    })();
  }, [items, medusaCartId, syncFromMedusaCart]);

  const setLineQty = useCallback(
    (productSlug: string, size: ProductSizeKey, qty: number) => {
      const line = items.find((item) => cartLineKey(item) === cartLineKey({ productSlug, size }));
      if (qty < 1) {
        setItems((prev) => prev.filter((item) => cartLineKey(item) !== cartLineKey({ productSlug, size })));
        if (line?.lineId && medusaCartId) {
          void removeLineItem(medusaCartId, line.lineId)
            .then(() => syncFromMedusaCart(medusaCartId))
            .catch(() => {});
        }
        return;
      }
      const nextQty = Math.min(99, Math.floor(qty));
      setItems((prev) => {
        const key = cartLineKey({ productSlug, size });
        return prev.map((item) => (cartLineKey(item) === key ? { ...item, qty: nextQty } : item));
      });
      if (line?.lineId && medusaCartId) {
        void updateLineItem(medusaCartId, line.lineId, nextQty)
          .then(() => syncFromMedusaCart(medusaCartId))
          .catch(() => {});
      }
    },
    [items, medusaCartId, syncFromMedusaCart],
  );

  const addGiftWrap = useCallback(() => {
    if (giftWrapEgp > 0) return;
    const previousGiftWrap = giftWrapEgp;

    void (async () => {
      try {
        const cartId = await ensureMedusaCartId();
        const { cart } = await getCart(cartId);
        const existingGiftWrapLine = getGiftWrapLineItem(cart);

        if (existingGiftWrapLine?.id) {
          if (existingGiftWrapLine.quantity !== 1) {
            await updateLineItem(cartId, existingGiftWrapLine.id, 1);
          }
          await syncFromMedusaCart(cartId);
          return;
        }

        const offer = await resolveGiftWrapOffer();
        if (!offer.variantId) {
          throw new Error('Gift wrap variant is not available in Medusa.');
        }

        if (typeof offer.priceEgp === 'number' && offer.priceEgp > 0) {
          setGiftWrapCatalogPriceEgp(offer.priceEgp);
          setGiftWrapEgpState(offer.priceEgp);
        }

        await addLineItem(cartId, offer.variantId, 1);
        await syncFromMedusaCart(cartId);
      } catch {
        setGiftWrapEgpState(previousGiftWrap);
      }
    })();
  }, [ensureMedusaCartId, giftWrapEgp, resolveGiftWrapOffer, syncFromMedusaCart]);

  const removeGiftWrap = useCallback(() => {
    if (giftWrapEgp === 0) return;
    const previousGiftWrap = giftWrapEgp;
    setGiftWrapEgpState(0);

    void (async () => {
      try {
        if (!medusaCartId) {
          return;
        }

        const { cart } = await getCart(medusaCartId);
        const existingGiftWrapLine = getGiftWrapLineItem(cart);

        if (existingGiftWrapLine?.id) {
          await removeLineItem(medusaCartId, existingGiftWrapLine.id);
        }

        await syncFromMedusaCart(medusaCartId);
      } catch {
        setGiftWrapEgpState(previousGiftWrap);
      }
    })();
  }, [giftWrapEgp, medusaCartId, syncFromMedusaCart]);

  const clearCart = useCallback(() => {
    // Bump generation so any in-flight syncFromMedusaCart discards its result.
    cartGenerationRef.current += 1;
    setItems([]);
    setGiftWrapEgpState(0);
    setMedusaCartId(null);
    // Synchronously wipe localStorage so the stale cart ID can never be
    // re-loaded on a subsequent page mount (React effects are async).
    persistItems([]);
    persistMedusaCartId(null);
  }, []);

  const replaceMedusaCartId = useCallback((cartId: string | null) => {
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
      items,
      addItem,
      removeItem,
      setLineQty,
      clearCart,
      replaceMedusaCartId,
      totalQty,
      subtotalEgp,
      giftWrapEgp,
      giftWrapCatalogPriceEgp,
      addGiftWrap,
      removeGiftWrap,
      miniCartOpen,
      setMiniCartOpen,
      lastAddedItem,
    }),
    [
      items,
      addItem,
      removeItem,
      setLineQty,
      clearCart,
      replaceMedusaCartId,
      totalQty,
      subtotalEgp,
      giftWrapEgp,
      giftWrapCatalogPriceEgp,
      addGiftWrap,
      removeGiftWrap,
      miniCartOpen,
      lastAddedItem,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
