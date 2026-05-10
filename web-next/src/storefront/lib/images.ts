/**
 * Placeholder-image detection for storefront surfaces.
 *
 * Uses the env-configurable `NEXT_PUBLIC_PLACEHOLDER_URL_PATTERNS` (comma-separated)
 * or falls back to common placeholder markers. Guards against showing literal
 * "IMAGE COMING SOON" or stock placeholder assets on public pages.
 *
 * @module images
 */

const DEFAULT_PATTERNS = "coming-soon,placeholder,placehold.co,via.placeholder";

function getPlaceholderPatterns(): RegExp[] {
  const raw =
    (typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_PLACEHOLDER_URL_PATTERNS
      : undefined) ?? DEFAULT_PATTERNS;

  return raw
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => new RegExp(p, "i"));
}

let _cachedPatterns: RegExp[] | null = null;
function patterns(): RegExp[] {
  if (!_cachedPatterns) _cachedPatterns = getPlaceholderPatterns();
  return _cachedPatterns;
}

/**
 * Returns `true` when the URL is missing or matches a known placeholder pattern.
 * Use this to gate product images on every public surface.
 */
export function isPlaceholderImageUrl(url?: string | null): boolean {
  if (!url || !url.trim()) return true;
  return patterns().some((re) => re.test(url));
}

/**
 * Neutral brand tile fallback src — HORO wordmark on brand beige.
 * Used by MerchProductCard/Cart/Wishlist when `isPlaceholderImageUrl` is true.
 */
export const BRAND_TILE_FALLBACK_SRC = "/images/brand-tile-neutral.svg";
