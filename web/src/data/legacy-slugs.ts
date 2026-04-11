/**
 * Legacy URL and slug normalization — safe for production (no fixture catalog data).
 * Old storefront `/vibes/:slug` and legacy feeling keys map to canonical Medusa feeling slugs.
 */
export const LEGACY_VIBE_SLUG_TO_FEELING_SLUG: Record<string, string> = {
  'bold-electric': 'trends',
  'grounded-everyday': 'career',
  'playful-offbeat': 'fiction',
  'soft-quiet': 'mood',
  'warm-romantic': 'zodiac',
  emotions: 'mood',
  zodiac: 'zodiac',
  fiction: 'fiction',
  career: 'career',
  trends: 'trends',
};

export function mapLegacyFeelingSlug(slug: string): string {
  return LEGACY_VIBE_SLUG_TO_FEELING_SLUG[slug] ?? slug;
}
