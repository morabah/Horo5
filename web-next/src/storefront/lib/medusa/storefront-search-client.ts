import type { Product } from '@/storefront/data/site';
import { normalizeStorefrontProductApi, type StorefrontProductApi } from '@/storefront/lib/medusa/normalize-storefront-product';

export type StorefrontSearchFacets = {
  feelings: Record<string, number>;
};

export type StorefrontSearchResponse = {
  products: Product[];
  page: number;
  pageSize: number;
  total: number;
  facets: StorefrontSearchFacets;
};

function medusaBaseUrl() {
  return (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || '').trim().replace(/\/+$/, '');
}

function publishableKey() {
  return (process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '').trim();
}

function isLikelyCorsNetworkError(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('failed to fetch') ||
    normalized.includes('networkerror') ||
    normalized.includes('cors') ||
    normalized.includes('load failed')
  );
}

/**
 * Browser fetch to Medusa `GET /storefront/search` (publishable key).
 */
export async function fetchStorefrontSearch(params: {
  q?: string;
  feeling?: string;
  occasion?: string;
  category?: string;
  decoration?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ ok: true; data: StorefrontSearchResponse } | { ok: false; error: string }> {
  const base = medusaBaseUrl();
  const key = publishableKey();
  if (!base || !key) {
    return { ok: false, error: 'Medusa search is not configured (missing URL or publishable key).' };
  }

  const sp = new URLSearchParams();
  if (params.q?.trim()) sp.set('q', params.q.trim());
  if (params.feeling?.trim()) sp.set('feeling', params.feeling.trim());
  if (params.occasion?.trim()) sp.set('occasion', params.occasion.trim());
  if (params.category?.trim()) sp.set('category', params.category.trim());
  if (params.decoration?.trim()) sp.set('decoration', params.decoration.trim());
  if (params.page != null) sp.set('page', String(params.page));
  if (params.pageSize != null) sp.set('pageSize', String(params.pageSize));

  try {
    const res = await fetch(`${base}/storefront/search?${sp.toString()}`, {
      headers: { 'x-publishable-api-key': key },
      cache: 'no-store',
    });
    const text = await res.text();
    if (!res.ok) {
      return { ok: false, error: text.slice(0, 200) || `HTTP ${res.status}` };
    }
    const raw = JSON.parse(text) as {
      products?: StorefrontProductApi[];
      page?: number;
      pageSize?: number;
      total?: number;
      facets?: StorefrontSearchFacets;
    };
    const products = (raw.products ?? []).map((p) => normalizeStorefrontProductApi(p));
    return {
      ok: true,
      data: {
        products,
        page: typeof raw.page === 'number' ? raw.page : 1,
        pageSize: typeof raw.pageSize === 'number' ? raw.pageSize : 24,
        total: typeof raw.total === 'number' ? raw.total : products.length,
        facets: raw.facets ?? { feelings: {} },
      },
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (isLikelyCorsNetworkError(message)) {
      return {
        ok: false,
        error: 'Live catalog search is unreachable from this origin. Falling back to local search ranking.',
      };
    }
    return { ok: false, error: message };
  }
}

export function isStorefrontServerSearchConfigured() {
  return Boolean(medusaBaseUrl() && publishableKey());
}

/**
 * Browser-side cross-origin calls to Medusa search can be blocked when CORS
 * isn't configured for the current storefront origin. In that case we skip
 * the live call and rely on local ranking to keep discovery functional.
 */
export function shouldUseBrowserStorefrontSearch() {
  if (!isStorefrontServerSearchConfigured()) return false;
  if (typeof window === 'undefined') return true;
  try {
    const base = medusaBaseUrl();
    if (!base) return false;
    return new URL(base).origin === window.location.origin;
  } catch {
    return false;
  }
}
