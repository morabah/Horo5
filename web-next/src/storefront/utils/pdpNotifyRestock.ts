/** Restock notifications — persists locally and posts to Medusa via `/api/pdp-notify`. */
export async function submitPdpNotify(payload: {
  productId: string;
  productSlug: string;
  email: string;
  locale: 'en' | 'ar';
}): Promise<boolean> {
  const key = `horo-pdp-notify-${payload.productSlug}`;
  try {
    const res = await fetch('/api/pdp-notify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        product_id: payload.productId,
        email: payload.email,
        locale: payload.locale,
      }),
    });
    if (res.ok) {
      localStorage.setItem(key, payload.email);
      return true;
    }
  } catch {
    /* fall through to local-only */
  }
  try {
    localStorage.setItem(key, payload.email);
    return true;
  } catch {
    return false;
  }
}

/** @deprecated Use submitPdpNotify — kept for PDP size-specific keys. */
export function notifyRestockSignup(payload: {
  productId?: string;
  productSlug: string;
  size: string;
  email: string;
  locale?: 'en' | 'ar';
}) {
  const key = `horo-pdp-notify-${payload.productSlug}-${payload.size}`;
  localStorage.setItem(key, payload.email);
  if (payload.productId) {
    void submitPdpNotify({
      productId: payload.productId,
      productSlug: payload.productSlug,
      email: payload.email,
      locale: payload.locale ?? 'en',
    });
  }
  if (process.env.NODE_ENV === 'development') {
    console.info('[PDP] notify restock', payload);
  }
}
