/**
 * Client-side fetcher for `/storefront/incentives`.
 *
 * The native Medusa Promotion is the source of truth for cart math (auto-applies free
 * shipping when subtotal ≥ threshold). This payload is **display-only**: progress bar
 * label, bundle eyebrow, gift-wrap toggle copy. When the fetch fails or the operator
 * has not configured an automatic free-shipping promotion, every field is null and
 * the storefront degrades to "no progress bar" — never invents a number.
 */

export type StorefrontLocalizedTextClient = string | { en?: string; ar?: string };

export type StorefrontIncentivesClient = {
  freeShipping: {
    promotionId: string;
    thresholdEgp: number;
    currency: string;
    label: StorefrontLocalizedTextClient;
  } | null;
  bundle: {
    promotionId: string;
    type: "buyget";
    requireQuantity: number;
    applyToQuantity: number;
    applicationValue: number;
    applicationKind: "fixed" | "percentage";
    label: StorefrontLocalizedTextClient;
  } | null;
  giftWrapProductHandle: string | null;
  giftWrapPriceEgp: number | null;
  giftWrapLabel: StorefrontLocalizedTextClient | null;
};

const baseUrl = (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/+$/, "");

const publishableApiKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";

let cached: StorefrontIncentivesClient | null = null;
let inflight: Promise<StorefrontIncentivesClient | null> | null = null;
let lastFetchedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

async function requestIncentives(): Promise<StorefrontIncentivesClient | null> {
  if (!publishableApiKey) return null;
  try {
    const headers = new Headers();
    headers.set("x-publishable-api-key", publishableApiKey);
    const response = await fetch(`${baseUrl}/storefront/incentives`, {
      credentials: "include",
      headers,
    });
    if (!response.ok) return null;
    return (await response.json()) as StorefrontIncentivesClient;
  } catch {
    return null;
  }
}

/**
 * Fetch (and memoize) the storefront incentives payload. Safe to call from any client
 * component that needs the free-shipping threshold or gift-wrap handle. Cached in
 * module memory for 5 minutes so we don't hit Medusa on every drawer open.
 */
export async function fetchStorefrontIncentivesClient(): Promise<StorefrontIncentivesClient | null> {
  const now = Date.now();
  if (cached && now - lastFetchedAt < CACHE_TTL_MS) return cached;
  if (inflight) return inflight;
  inflight = requestIncentives()
    .then((data) => {
      cached = data;
      lastFetchedAt = Date.now();
      return data;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** Pick the active locale string from a `LocalizedText` value (string or {en, ar}). */
export function pickLocalizedText(value: StorefrontLocalizedTextClient | null | undefined, locale: "en" | "ar"): string | null {
  if (!value) return null;
  if (typeof value === "string") return value.trim() ? value : null;
  const preferred = locale === "ar" ? value.ar : value.en;
  if (preferred && preferred.trim()) return preferred;
  const fallback = locale === "ar" ? value.en : value.ar;
  return fallback && fallback.trim() ? fallback : null;
}
