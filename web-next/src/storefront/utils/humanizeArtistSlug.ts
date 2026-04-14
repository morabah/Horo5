/** PDP fallback when slug is set but does not resolve to a catalog artist (hyphens/underscores → words). */
export function humanizeArtistSlugForDisplay(slug: string): string {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return '';
  return normalized
    .split(/[-_\s]+/)
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
