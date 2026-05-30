export async function submitAbandonedCartLead(payload: {
  email: string;
  cartId?: string | null;
  surface: 'cart' | 'checkout' | 'plp';
  locale: 'en' | 'ar';
  cartValueEgp?: number;
  marketingConsent: boolean;
}): Promise<boolean> {
  if (!payload.marketingConsent) return false;
  try {
    const res = await fetch('/api/abandoned-cart', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: payload.email.trim(),
        cart_id: payload.cartId ?? undefined,
        surface: payload.surface,
        locale: payload.locale,
        cart_value_egp: payload.cartValueEgp,
        marketing_consent: true,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
