/**
 * SEM env (Vite):
 * - VITE_GA_MEASUREMENT_ID — GA4 measurement ID (G-xxxxxxxxxx)
 * - VITE_META_PIXEL_ID — Meta Pixel ID (numeric string)
 *
 * SEO:
 * - VITE_SITE_URL — canonical origin, no trailing slash (used in build for sitemap/robots)
 */

export function getGaMeasurementId(): string | undefined {
  return process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || undefined;
}

export function getMetaPixelId(): string | undefined {
  return process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || undefined;
}

export function hasAnySemIds(): boolean {
  return Boolean(getGaMeasurementId() || getMetaPixelId());
}
