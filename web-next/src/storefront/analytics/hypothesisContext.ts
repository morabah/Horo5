/**
 * V1.5.2 hypothesis context: audience segments, buyer routes, content jobs, and funnel assets.
 * Replaces the legacy "cold_discovery" default with V1.5.2-compatible dimensions.
 *
 * Backwards compatibility: HYPOTHESIS_PRIMARY_SEGMENT and HYPOTHESIS_KPI_MAP are
 * preserved as deprecated aliases so existing event instrumentation does not break.
 */

import type { Product } from '../data/catalog-types';

// ── V1.5.2 segments ────────────────────────────────────────────────────────

export const HYPOTHESIS_SEGMENTS = [
  '25-40',
  'gift-buyer',
  'artist-aware',
  '18-24',
  '40-plus',
  'unknown',
] as const;

export type HypothesisSegment = (typeof HYPOTHESIS_SEGMENTS)[number];

// ── V1.5.2 buyer routes ──────────────────────────────────────────────────

export const BUYER_ROUTES = [
  'feeling',
  'moment',
  'gift',
  'personality',
  'artist_drop',
  'world',
  'unknown',
] as const;

export type BuyerRoute = (typeof BUYER_ROUTES)[number];

// ── V1.5.2 content jobs ────────────────────────────────────────────────────

export const CONTENT_JOBS = [
  'attention',
  'recognition',
  'desire',
  'trust',
  'action',
  'satisfaction',
  'advocacy',
  'repeat',
] as const;

export type ContentJob = (typeof CONTENT_JOBS)[number];

// ── V1.5.2 funnel asset types ─────────────────────────────────────────────

export const FUNNEL_ASSET_TYPES = [
  'homepage_hero',
  'pdp',
  'gift_page',
  'artist_story',
  'whatsapp',
  'checkout',
  'waitlist',
  'ugc',
  'review',
] as const;

export type FunnelAssetType = (typeof FUNNEL_ASSET_TYPES)[number];

// ── Default content job per event type (heuristic) ─────────────────────────

export const DEFAULT_CONTENT_JOB_BY_EVENT: Record<string, ContentJob> = {
  commerce_product_viewed: 'desire',
  commerce_size_selected: 'trust',
  commerce_cart_viewed: 'desire',
  commerce_add_to_cart: 'action',
  commerce_checkout_started: 'trust',
  commerce_checkout_submitted: 'action',
  commerce_payment_method_selected: 'action',
  commerce_order_completed: 'satisfaction',
  commerce_wishlist_add: 'desire',
  commerce_wishlist_remove: 'desire',
};

// ── Segment derivation helpers ─────────────────────────────────────────────

export function deriveHypothesisSegment(product?: Product | null): HypothesisSegment {
  if (!product) return 'unknown';
  if (product.primaryAudience) {
    const pa = product.primaryAudience;
    if (pa === '25-40' || pa === '18-24' || pa === '40-plus' || pa === 'gift-buyer' || pa === 'artist-aware') {
      return pa;
    }
  }
  if (product.giftable) return 'gift-buyer';
  if (product.buyerRoute === 'artist_drop') return 'artist-aware';
  return 'unknown';
}

export function deriveBuyerRoute(product?: Product | null): BuyerRoute {
  if (!product) return 'unknown';
  if (product.buyerRoute) return product.buyerRoute;
  if (product.giftable) return 'gift';
  return 'unknown';
}

export function deriveGiftIntent(product?: Product | null): boolean {
  if (!product) return false;
  return product.giftable === true || (product.giftOccasionTags && product.giftOccasionTags.length > 0) || product.buyerRoute === 'gift';
}

export function deriveFirstWedgeEligible(product?: Product | null): boolean {
  if (!product) return false;
  return product.firstWedgeEligible === true;
}

// ── Legacy backwards-compatible aliases (deprecated) ───────────────────────

/** @deprecated Use deriveHypothesisSegment or explicit V1.5.2 segment instead. */
export const HYPOTHESIS_PRIMARY_SEGMENT = 'cold_discovery' as const;

/** @deprecated Use explicit segment assignment instead. */
export const HYPOTHESIS_SECONDARY_SEGMENT = 'returning' as const;

/** @deprecated Use DEFAULT_CONTENT_JOB_BY_EVENT or explicit job assignment instead. */
export const HYPOTHESIS_KPI_MAP = {
  feelingClickThrough: { event: 'horo_funnel_step', step: 'home_to_feelings' },
  pdpFromHome: { event: 'horo_funnel_step', step: 'home_to_pdp' },
  addToCart: { event: 'add_to_cart' },
  beginCheckout: { event: 'begin_checkout' },
  homeScroll: { event: 'horo_home_scroll' },
  funnelStep: { event: 'horo_funnel_step' },
} as const;
