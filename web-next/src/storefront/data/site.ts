export * from './catalog-types';

/**
 * Fixture imports — guarded by development mode (Next.js / Node).
 */
import {
  ARTIST_FIXTURES,
  FEELING_FIXTURES,
  OCCASION_FIXTURES,
  products,
  SUBFEELING_FIXTURES,
} from './dev-fixtures';

import { feelingLineMatchesAssignments } from './feelingLineBrowse';
import { mapLegacyFeelingSlug } from './legacy-slugs';

import type { Artist, Feeling, MerchEvent, Occasion, Product, RuntimeCatalog, Subfeeling } from './catalog-types';

function viteDevFixturesEnabled(): boolean {
  return process.env.NODE_ENV === "development";
}

let runtimeArtists: Artist[] | null = null;
let runtimeProducts: Product[] | null = null;
let runtimeFeelings: Feeling[] | null = null;
let runtimeSubfeelings: Subfeeling[] | null = null;
let runtimeOccasions: Occasion[] | null = null;
let runtimeEvents: MerchEvent[] | null = null;

export function setRuntimeCatalog(next: Partial<RuntimeCatalog> | null) {
  if (!next) {
    runtimeArtists = null;
    runtimeFeelings = null;
    runtimeSubfeelings = null;
    runtimeProducts = null;
    runtimeOccasions = null;
    runtimeEvents = null;
    return;
  }

  if (next.artists) {
    runtimeArtists = next.artists.length > 0 ? next.artists : null;
  }

  if (next.feelings) {
    runtimeFeelings = next.feelings.length > 0 ? next.feelings : null;
  }

  if (next.subfeelings) {
    runtimeSubfeelings = next.subfeelings.length > 0 ? next.subfeelings : null;
  }

  if (next.products) {
    runtimeProducts = next.products.length > 0 ? next.products : null;
  }

  if (next.occasions) {
    runtimeOccasions = next.occasions.length > 0 ? next.occasions : null;
  }

  if (next.events) {
    runtimeEvents = next.events.length > 0 ? next.events : null;
  }
}

export function setRuntimeArtists(next: Artist[] | null) {
  runtimeArtists = next && next.length > 0 ? next : null;
}

export function setRuntimeProducts(next: Product[] | null) {
  runtimeProducts = next && next.length > 0 ? next : null;
}

export function setRuntimeFeelings(next: Feeling[] | null) {
  runtimeFeelings = next && next.length > 0 ? next : null;
}

export function setRuntimeSubfeelings(next: Subfeeling[] | null) {
  runtimeSubfeelings = next && next.length > 0 ? next : null;
}

export function setRuntimeOccasions(next: Occasion[] | null) {
  runtimeOccasions = next && next.length > 0 ? next : null;
}

export function setRuntimeEvents(next: MerchEvent[] | null) {
  runtimeEvents = next && next.length > 0 ? next : null;
}

export function getFeelings(): Feeling[] {
  if (runtimeFeelings && runtimeFeelings.length > 0) {
    return runtimeFeelings;
  }
  if (viteDevFixturesEnabled()) {
    return FEELING_FIXTURES;
  }
  return [];
}

export function getArtists(): Artist[] {
  if (runtimeArtists && runtimeArtists.length > 0) {
    return runtimeArtists;
  }
  if (viteDevFixturesEnabled()) {
    return ARTIST_FIXTURES;
  }
  return [];
}

export function getSubfeelings(): Subfeeling[] {
  if (runtimeSubfeelings && runtimeSubfeelings.length > 0) {
    return runtimeSubfeelings;
  }
  if (viteDevFixturesEnabled()) {
    return SUBFEELING_FIXTURES;
  }
  return [];
}

export function getSubfeelingsByFeeling(feelingSlug: string): Subfeeling[] {
  const resolved = mapLegacyFeelingSlug(feelingSlug);
  return getSubfeelings().filter((subfeeling) => subfeeling.feelingSlug === resolved);
}

export function getProducts(): Product[] {
  if (runtimeProducts && runtimeProducts.length > 0) {
    return runtimeProducts;
  }
  if (viteDevFixturesEnabled()) {
    return products;
  }
  return [];
}

export function getOccasions(): Occasion[] {
  if (runtimeOccasions && runtimeOccasions.length > 0) {
    return runtimeOccasions;
  }
  if (viteDevFixturesEnabled()) {
    return OCCASION_FIXTURES;
  }
  return [];
}

export function getMerchEvents(): MerchEvent[] {
  return runtimeEvents && runtimeEvents.length > 0 ? runtimeEvents : [];
}

export function getFeelingLines(): import('./catalog-types').Subfeeling[] {
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

/** True when the product has at least one real product image (not a generic fallback). */
export function productHasRealImage(product: Product): boolean {
  if (product.media?.card) return true;
  if (product.media?.main) return true;
  if (product.media?.gallery && product.media.gallery.filter(Boolean).length > 0) return true;
  if (product.thumbnail) return true;
  return false;
}
