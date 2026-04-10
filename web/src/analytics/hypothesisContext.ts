/**
 * Baseline segment and KPI mapping for the “too much info distracts the client” hypothesis.
 * Use these constants on custom GA4 events so explorations can filter by `hypothesis_segment`
 * and map events to business KPIs.
 */

/** Primary launch audience: first-time visitors discovering feeling-led merchandising. */
export const HYPOTHESIS_PRIMARY_SEGMENT = 'cold_discovery' as const;

/** Secondary: repeat visitors (shorten path / compact home experiments). */
export const HYPOTHESIS_SECONDARY_SEGMENT = 'returning' as const;

/** GA4 / data layer: standard event names that map to KPIs. */
export const HYPOTHESIS_KPI_MAP = {
  /** Shop exploration from home hub */
  feelingClickThrough: { event: 'horo_funnel_step', step: 'home_to_feelings' },
  /** Product interest */
  pdpFromHome: { event: 'horo_funnel_step', step: 'home_to_pdp' },
  /** Standard GA4 — already fired from cart */
  addToCart: { event: 'add_to_cart' },
  beginCheckout: { event: 'begin_checkout' },
  /** Engagement depth */
  homeScroll: { event: 'horo_home_scroll' },
  /** Hypothesis variant */
  funnelStep: { event: 'horo_funnel_step' },
} as const;

export type HypothesisSegment = typeof HYPOTHESIS_PRIMARY_SEGMENT | typeof HYPOTHESIS_SECONDARY_SEGMENT;
