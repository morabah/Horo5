import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { getProduct } from '../data/site';
import { fetchServerWishlistSlugs, syncWishlistSlugToServer } from '../lib/wishlist-client';

const STORAGE_KEY = 'horo-wishlist-v1';
const MAX_ITEMS = 50;

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

function loadSlugs(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((x: unknown): x is string => typeof x === 'string')
      : [];
  } catch {
    return [];
  }
}

function saveSlugs(slugs: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
  } catch {
    /* quota / private mode */
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

type WishlistContextValue = {
  slugs: string[];
  count: number;
  has: (slug: string) => boolean;
  toggle: (slug: string) => void;
  add: (slug: string) => void;
  remove: (slug: string) => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function WishlistProvider({ children }: { children: ReactNode }) {
  // Empty on SSR and first client paint so markup matches server; hydrate after mount.
  const [slugs, setSlugs] = useState<string[]>([]);

  useEffect(() => {
    const local = loadSlugs();
    setSlugs(local);
    void fetchServerWishlistSlugs().then((remote) => {
      if (!remote?.length) return;
      const merged = [...new Set([...remote, ...local])].slice(0, MAX_ITEMS);
      saveSlugs(merged);
      setSlugs(merged);
    });
  }, []);

  const has = useCallback((slug: string) => slugs.includes(slug), [slugs]);

  const toggle = useCallback((slug: string) => {
    setSlugs((prev) => {
      const base = prev.length > 0 ? prev : loadSlugs();
      const adding = !base.includes(slug);
      const next = adding ? [slug, ...base].slice(0, MAX_ITEMS) : base.filter((s) => s !== slug);
      saveSlugs(next);
      const product = getProduct(slug);
      void syncWishlistSlugToServer(slug, product?.id, adding);
      return next;
    });
  }, []);

  const add = useCallback((slug: string) => {
    setSlugs((prev) => {
      const base = prev.length > 0 ? prev : loadSlugs();
      if (base.includes(slug)) return base;
      const next = [slug, ...base].slice(0, MAX_ITEMS);
      saveSlugs(next);
      const product = getProduct(slug);
      void syncWishlistSlugToServer(slug, product?.id, true);
      return next;
    });
  }, []);

  const remove = useCallback((slug: string) => {
    setSlugs((prev) => {
      const next = prev.filter((s) => s !== slug);
      saveSlugs(next);
      const product = getProduct(slug);
      void syncWishlistSlugToServer(slug, product?.id, false);
      return next;
    });
  }, []);

  return (
    <WishlistContext.Provider value={{ slugs, count: slugs.length, has, toggle, add, remove }}>
      {children}
    </WishlistContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error('useWishlist must be used inside <WishlistProvider>');
  }
  return ctx;
}
