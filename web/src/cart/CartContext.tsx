import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { trackAddToCart } from '../analytics/events';
import { getProduct, type ProductSizeKey } from '../data/site';
import { CART_STORAGE_KEY, MEDUSA_CART_ID_STORAGE_KEY, cartLineKey, type CartLine } from './types';
import {
  addLineItem,
  createCart,
  getCart,
  removeLineItem,
  updateLineItem,
} from '../lib/medusa/client';
import { toCartLines } from '../lib/medusa/adapters';

export const GIFT_WRAP_PRICE_EGP = 200;

const GIFT_WRAP_STORAGE_KEY = 'horo-gift-wrap-v1';

function loadGiftWrapEgp(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(GIFT_WRAP_STORAGE_KEY);
    if (raw == null) return 0;
    const n = Number(raw);
    return n === GIFT_WRAP_PRICE_EGP ? GIFT_WRAP_PRICE_EGP : 0;
  } catch {
    return 0;
  }
}

function persistGiftWrapEgp(egp: number) {
  try {
    localStorage.setItem(GIFT_WRAP_STORAGE_KEY, String(egp));
  } catch {
    /* ignore */
  }
}

type CartContextValue = {
  items: CartLine[];
  addItem: (productSlug: string, size: ProductSizeKey, qty?: number) => void;
  removeItem: (productSlug: string, size: ProductSizeKey) => void;
  setLineQty: (productSlug: string, size: ProductSizeKey, qty: number) => void;
  clearCart: () => void;
  totalQty: number;
  subtotalEgp: number;
  giftWrapEgp: number;
  setGiftWrapEgp: (egp: 0 | typeof GIFT_WRAP_PRICE_EGP) => void;
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
    /* quota / private mode */
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

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [giftWrapEgp, setGiftWrapEgpState] = useState(0);
  const [medusaCartId, setMedusaCartId] = useState<string | null>(null);
  const [storageReady, setStorageReady] = useState(false);

  const syncFromMedusaCart = useCallback(async (cartId: string) => {
    try {
      const { cart } = await getCart(cartId);
      setItems(toCartLines(cart));
    } catch {
      // Keep local fallback state if backend is unavailable.
    }
  }, []);

  useEffect(() => {
    setItems(loadItems());
    setGiftWrapEgpState(loadGiftWrapEgp());
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
    persistGiftWrapEgp(giftWrapEgp);
  }, [giftWrapEgp, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    persistMedusaCartId(medusaCartId);
  }, [medusaCartId, storageReady]);

  const ensureMedusaCartId = useCallback(async () => {
    if (medusaCartId) return medusaCartId;
    const created = await createCart();
    setMedusaCartId(created.cart.id);
    return created.cart.id;
  }, [medusaCartId]);

  const resolveVariantId = useCallback((productSlug: string, size: ProductSizeKey) => {
    return getProduct(productSlug)?.variantsBySize?.[size]?.id ?? null;
  }, []);

  const addItem = useCallback((productSlug: string, size: ProductSizeKey, qty = 1) => {
    const product = getProduct(productSlug);
    if (!product || qty < 1) return;
    const add = Math.min(qty, 99);
    const variant = product.variantsBySize?.[size];
    const unitPriceEgp = variant?.priceEgp ?? product.priceEgp;
    const variantId = variant?.id;

    setItems((prev) => {
      const key = cartLineKey({ productSlug, size });
      const idx = prev.findIndex((l) => cartLineKey(l) === key);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          qty: Math.min(99, next[idx].qty + add),
          productName: next[idx].productName ?? product.name,
          imageSrc: next[idx].imageSrc ?? product.media?.main ?? product.thumbnail ?? undefined,
          unitPriceEgp: next[idx].unitPriceEgp ?? unitPriceEgp,
          variantId: next[idx].variantId ?? variantId ?? undefined,
        };
        return next;
      }
      return [
        ...prev,
        {
          productSlug,
          size,
          qty: add,
          productName: product.name,
          imageSrc: product.media?.main ?? product.thumbnail ?? undefined,
          unitPriceEgp,
          variantId: variantId ?? undefined,
        },
      ];
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
    const line = items.find((l) => cartLineKey(l) === cartLineKey({ productSlug, size }));
    setItems((prev) => prev.filter((l) => cartLineKey(l) !== cartLineKey({ productSlug, size })));
    if (!line?.lineId || !medusaCartId) return;
    void (async () => {
      try {
        await removeLineItem(medusaCartId, line.lineId as string);
        await syncFromMedusaCart(medusaCartId);
      } catch {
        // Keep optimistic removal.
      }
    })();
  }, [items, medusaCartId, syncFromMedusaCart]);

  const setLineQty = useCallback(
    (productSlug: string, size: ProductSizeKey, qty: number) => {
      const line = items.find((l) => cartLineKey(l) === cartLineKey({ productSlug, size }));
      if (qty < 1) {
        setItems((prev) => prev.filter((l) => cartLineKey(l) !== cartLineKey({ productSlug, size })));
        if (line?.lineId && medusaCartId) {
          void removeLineItem(medusaCartId, line.lineId).then(() => syncFromMedusaCart(medusaCartId)).catch(() => {});
        }
        return;
      }
      const nextQty = Math.min(99, Math.floor(qty));
      setItems((prev) => {
        const key = cartLineKey({ productSlug, size });
        return prev.map((l) => (cartLineKey(l) === key ? { ...l, qty: nextQty } : l));
      });
      if (line?.lineId && medusaCartId) {
        void updateLineItem(medusaCartId, line.lineId, nextQty).then(() => syncFromMedusaCart(medusaCartId)).catch(() => {});
      }
    },
    [items, medusaCartId, syncFromMedusaCart],
  );

  const setGiftWrapEgp = useCallback((egp: 0 | typeof GIFT_WRAP_PRICE_EGP) => {
    setGiftWrapEgpState(egp);
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setGiftWrapEgpState(0);
    setMedusaCartId(null);
  }, []);

  const totalQty = useMemo(() => items.reduce((s, l) => s + l.qty, 0), [items]);

  const subtotalEgp = useMemo(() => {
    return items.reduce((sum, line) => {
      const p = getProduct(line.productSlug);
      const linePrice =
        line.unitPriceEgp ??
        p?.variantsBySize?.[line.size]?.priceEgp ??
        p?.priceEgp;
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
      totalQty,
      subtotalEgp,
      giftWrapEgp,
      setGiftWrapEgp,
    }),
    [items, addItem, removeItem, setLineQty, clearCart, totalQty, subtotalEgp, giftWrapEgp, setGiftWrapEgp],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
