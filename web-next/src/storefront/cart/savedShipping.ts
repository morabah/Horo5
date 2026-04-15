const STORAGE_KEY = 'horo-saved-shipping-v1';

export type SavedShippingPayload = {
  email: string;
  phone: string;
  fullName: string;
  line1: string;
  line2: string;
  city: string;
  province: string;
  postalCode: string;
};

export function loadSavedShipping(): SavedShippingPayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedShippingPayload>;
    if (!parsed || typeof parsed !== 'object') return null;
    const line1 = typeof parsed.line1 === 'string' ? parsed.line1.trim() : '';
    const city = typeof parsed.city === 'string' ? parsed.city.trim() : '';
    if (!line1 || !city) return null;
    return {
      email: typeof parsed.email === 'string' ? parsed.email.trim() : '',
      phone: typeof parsed.phone === 'string' ? parsed.phone.trim() : '',
      fullName: typeof parsed.fullName === 'string' ? parsed.fullName.trim() : '',
      line1,
      line2: typeof parsed.line2 === 'string' ? parsed.line2.trim() : '',
      city,
      province: typeof parsed.province === 'string' ? parsed.province.trim() : city,
      postalCode: typeof parsed.postalCode === 'string' ? parsed.postalCode.trim() : '',
    };
  } catch {
    return null;
  }
}

export function saveSavedShipping(payload: SavedShippingPayload): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

export function clearSavedShipping(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
