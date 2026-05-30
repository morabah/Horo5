const WISHLIST_CLIENT_KEY = 'horo-wishlist-client-id';

export function getWishlistClientId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let id = localStorage.getItem(WISHLIST_CLIENT_KEY);
    if (!id) {
      id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `wl-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(WISHLIST_CLIENT_KEY, id);
    }
    return id;
  } catch {
    return '';
  }
}

export async function fetchServerWishlistSlugs(): Promise<string[] | null> {
  const clientId = getWishlistClientId();
  if (!clientId) return null;
  try {
    const res = await fetch('/api/wishlist', {
      headers: { 'x-horo-wishlist-client': clientId },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { slugs?: string[] };
    return Array.isArray(data.slugs) ? data.slugs : [];
  } catch {
    return null;
  }
}

export async function syncWishlistSlugToServer(slug: string, productId: string | undefined, add: boolean): Promise<void> {
  const clientId = getWishlistClientId();
  if (!clientId) return;
  try {
    await fetch('/api/wishlist', {
      method: add ? 'POST' : 'DELETE',
      headers: {
        'content-type': 'application/json',
        'x-horo-wishlist-client': clientId,
      },
      body: JSON.stringify({ product_slug: slug, product_id: productId }),
    });
  } catch {
    /* local wishlist remains source of truth offline */
  }
}
