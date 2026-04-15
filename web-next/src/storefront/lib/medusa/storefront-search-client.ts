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
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export function isStorefrontServerSearchConfigured() {
  return Boolean(medusaBaseUrl() && publishableKey());
}
