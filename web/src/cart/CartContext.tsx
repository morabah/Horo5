import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getProduct, type ProductSizeKey } from '../data/site';
import { CART_STORAGE_KEY, cartLineKey, type CartLine } from './types';

type CartContextValue = {
  items: CartLine[];
  addItem: (productSlug: string, size: ProductSizeKey, qty?: number) => void;
  removeItem: (productSlug: string, size: ProductSizeKey) => void;
  setLineQty: (productSlug: string, size: ProductSizeKey, qty: number) => void;
  clearCart: () => void;
  totalQty: number;
  subtotalEgp: number;
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

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>(loadItems);

  useEffect(() => {
    persistItems(items);
  }, [items]);

  const addItem = useCallback((productSlug: string, size: ProductSizeKey, qty = 1) => {
    if (!getProduct(productSlug) || qty < 1) return;
    const add = Math.min(qty, 99);
    setItems((prev) => {
      const key = cartLineKey({ productSlug, size });
      const idx = prev.findIndex((l) => cartLineKey(l) === key);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: Math.min(99, next[idx].qty + add) };
        return next;
      }
      return [...prev, { productSlug, size, qty: add }];
    });
  }, []);

  const removeItem = useCallback((productSlug: string, size: ProductSizeKey) => {
    setItems((prev) => prev.filter((l) => cartLineKey(l) !== cartLineKey({ productSlug, size })));
  }, []);

  const setLineQty = useCallback(
    (productSlug: string, size: ProductSizeKey, qty: number) => {
      if (qty < 1) {
        setItems((prev) => prev.filter((l) => cartLineKey(l) !== cartLineKey({ productSlug, size })));
        return;
      }
      const nextQty = Math.min(99, Math.floor(qty));
      setItems((prev) => {
        const key = cartLineKey({ productSlug, size });
        return prev.map((l) => (cartLineKey(l) === key ? { ...l, qty: nextQty } : l));
      });
    },
    [],
  );

  const clearCart = useCallback(() => setItems([]), []);

  const totalQty = useMemo(() => items.reduce((s, l) => s + l.qty, 0), [items]);

  const subtotalEgp = useMemo(() => {
    return items.reduce((sum, line) => {
      const p = getProduct(line.productSlug);
      if (!p) return sum;
      return sum + p.priceEgp * line.qty;
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
    }),
    [items, addItem, removeItem, setLineQty, clearCart, totalQty, subtotalEgp],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
