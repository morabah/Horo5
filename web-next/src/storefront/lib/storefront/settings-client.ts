import type { StorefrontGovernorate, StorefrontSettingsPayload } from '@/lib/storefront-server';

const baseUrl = (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000').replace(/\/+$/, '');
const publishableApiKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '';

let cached: StorefrontSettingsPayload | null = null;
let inflight: Promise<StorefrontSettingsPayload | null> | null = null;
let lastFetchedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

async function requestSettings(): Promise<StorefrontSettingsPayload | null> {
  if (!publishableApiKey) return null;
  try {
    const headers = new Headers();
    headers.set('x-publishable-api-key', publishableApiKey);
    const response = await fetch(`${baseUrl}/storefront/settings`, { credentials: 'include', headers });
    if (!response.ok) return null;
    return (await response.json()) as StorefrontSettingsPayload;
  } catch {
    return null;
  }
}

export async function fetchStorefrontSettingsClient(): Promise<StorefrontSettingsPayload | null> {
  const now = Date.now();
  if (cached && now - lastFetchedAt < CACHE_TTL_MS) return cached;
  if (inflight) return inflight;
  inflight = requestSettings()
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

export type { StorefrontGovernorate };
