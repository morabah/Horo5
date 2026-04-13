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
import { CART_STORAGE_KEY, MEDUSA_CART_ID_STORAGE_KEY, cartLineKey, type CartLine } from './types';

export const GIFT_WRAP_PRICE_EGP = 200;

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
  setGiftWrapEgp: (egp: 0 | typeof GIFT_WRAP_PRICE_EGP) => void;
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

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [giftWrapEgp, setGiftWrapEgpState] = useState(0);
  const [medusaCartId, setMedusaCartId] = useState<string | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  const [miniCartOpen, setMiniCartOpen] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState<LastAddedItem | null>(null);
  const giftWrapVariantPromiseRef = useRef<Promise<string | null> | null>(null);

  const syncFromMedusaCart = useCallback(async (cartId: string) => {
    try {
      const { cart } = await getCart(cartId);
      setItems(toCartLines(cart));
      setGiftWrapEgpState(getCartGiftWrapEgp(cart));
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

  const resolveGiftWrapVariantId = useCallback(async () => {
    if (!giftWrapVariantPromiseRef.current) {
      giftWrapVariantPromiseRef.current = getProductByHandle(GIFT_WRAP_PRODUCT_HANDLE)
        .then((response) => response?.product.variants?.[0]?.id ?? null)
        .catch(() => null);
    }

    return giftWrapVariantPromiseRef.current;
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

  const setGiftWrapEgp = useCallback((egp: 0 | typeof GIFT_WRAP_PRICE_EGP) => {
    if (egp === giftWrapEgp) return;
    const previousGiftWrap = giftWrapEgp;
    setGiftWrapEgpState(egp);

    void (async () => {
      try {
        const cartId = await ensureMedusaCartId();
        const { cart } = await getCart(cartId);
        const existingGiftWrapLine = getGiftWrapLineItem(cart);

        if (egp === 0) {
          if (existingGiftWrapLine?.id) {
            await removeLineItem(cartId, existingGiftWrapLine.id);
          }
          await syncFromMedusaCart(cartId);
          return;
        }

        if (existingGiftWrapLine?.id) {
          if (existingGiftWrapLine.quantity !== 1) {
            await updateLineItem(cartId, existingGiftWrapLine.id, 1);
          }
          await syncFromMedusaCart(cartId);
          return;
        }

        const variantId = await resolveGiftWrapVariantId();
        if (!variantId) {
          throw new Error('Gift wrap variant is not available in Medusa.');
        }

        await addLineItem(cartId, variantId, 1);
        await syncFromMedusaCart(cartId);
      } catch {
        setGiftWrapEgpState(previousGiftWrap);
      }
    })();
  }, [ensureMedusaCartId, giftWrapEgp, resolveGiftWrapVariantId, syncFromMedusaCart]);

  const clearCart = useCallback(() => {
    setItems([]);
    setGiftWrapEgpState(0);
    setMedusaCartId(null);
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
      setGiftWrapEgp,
      miniCartOpen,
      setMiniCartOpen,
      lastAddedItem,
    }),
    [items, addItem, removeItem, setLineQty, clearCart, replaceMedusaCartId, totalQty, subtotalEgp, giftWrapEgp, setGiftWrapEgp, miniCartOpen, lastAddedItem],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
