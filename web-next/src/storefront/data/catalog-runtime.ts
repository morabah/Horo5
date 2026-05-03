import {
  ARTIST_FIXTURES,
  FEELING_FIXTURES,
  OCCASION_FIXTURES,
  products,
  SUBFEELING_FIXTURES,
} from './dev-fixtures';
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
