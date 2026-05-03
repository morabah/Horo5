import type { Product, Feeling } from './catalog-types';
import { getFeelings, getSubfeelings, getProducts, getOccasions, getArtists } from './catalog-runtime';
import { feelingLineMatchesAssignments } from './feelingLineBrowse';
import { mapLegacyFeelingSlug } from './legacy-slugs';

export function getSubfeelingsByFeeling(feelingSlug: string) {
  const resolved = mapLegacyFeelingSlug(feelingSlug);
  return getSubfeelings().filter((subfeeling) => subfeeling.feelingSlug === resolved);
}

export function getFeelingLines() {
  return getSubfeelings();
}

/** Derive thematic line from product handle when `lineSlug` is not on the product (static catalog). */
export function inferProductLineSlug(productSlug: string): string | undefined {
  const product = getProduct(productSlug);
  return product?.primarySubfeelingSlug ?? (product ? product.lineSlug : undefined);
}

const resolveFeelingSlug = (slug: string) => mapLegacyFeelingSlug(slug);

export function getFeeling(slug: string) {
  return getFeelings().find((f) => f.slug === resolveFeelingSlug(slug));
}

export function getSubfeeling(slug: string) {
  return getSubfeelings().find((subfeeling) => subfeeling.slug === slug);
}

/** @deprecated Use Feeling */
export type Vibe = Feeling;
/** @deprecated Use getFeeling */
export const getVibe = getFeeling;

export function productsByFeeling(feelingSlug: string) {
  const resolved = resolveFeelingSlug(feelingSlug);
  return getProducts().filter((p) => {
    if (p.feelingBrowseEligible === false) {
      return false;
    }
    const assignments = p.feelingBrowseAssignments;
    if (assignments && assignments.length > 0) {
      return assignments.some((a) => resolveFeelingSlug(a.feelingSlug) === resolved);
    }
    return resolveFeelingSlug(p.primaryFeelingSlug ?? p.feelingSlug) === resolved;
  });
}

/** True when the product should appear on `/feelings/:feeling?line=` for a specific line (Medusa leaf categories only; no primary-metadata fallback). */
export function productAppearsInFeelingLine(product: Product, feelingSlug: string, lineParam: string) {
  return feelingLineMatchesAssignments(product.feelingBrowseAssignments, feelingSlug, lineParam);
}

export function productsBySubfeeling(subfeelingSlug: string) {
  return getProducts().filter((product) => {
    if (product.feelingBrowseEligible === false) {
      return false;
    }
    return (product.primarySubfeelingSlug ?? product.lineSlug) === subfeelingSlug;
  });
}

export function getOccasion(slug: string) {
  return getOccasions().find((o) => o.slug === slug);
}

export function getArtist(slug: string) {
  return getArtists().find((artist) => artist.slug === slug);
}

export function getProduct(slug: string) {
  return getProducts().find((p) => p.slug === slug);
}

/** @deprecated Use productsByFeeling */
export const productsByVibe = productsByFeeling;

export function productsByArtist(artistSlug: string) {
  return getProducts().filter((p) => p.artistSlug === artistSlug);
}

export function productsByOccasion(occasionSlug: import('./catalog-types').OccasionSlug) {
  return getProducts().filter((p) => p.occasionSlugs.includes(occasionSlug));
}

import { productMediaGalleryItemSrc } from './catalog-types';

/** True when the product has at least one real product image (not a generic fallback). */
export function productHasRealImage(product: Product): boolean {
  if (product.media?.card) return true;
  if (product.media?.main) return true;
  if (product.media?.gallery && product.media.gallery.some((entry) => Boolean(productMediaGalleryItemSrc(entry)))) return true;
  if (product.thumbnail) return true;
  return false;
}
