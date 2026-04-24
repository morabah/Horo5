import { capturePostHogEvent } from '@/lib/posthog-client';
import { HYPOTHESIS_PRIMARY_SEGMENT } from './hypothesisContext';

function gtagEvent(name: string, params: Record<string, string | number | undefined>) {
  if (typeof window === 'undefined') return;
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  if (!window.gtag || !gaId) return;
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined),
  ) as Record<string, string | number>;
  window.gtag('event', name, cleaned);
}

export type HoroFunnelStepPayload = {
  step: string;
  /** e.g. product slug when step is home_to_pdp */
  target?: string;
  compact_home?: boolean;
};

/** Custom GA4 funnel steps from home and hubs (configure as custom dimensions in GA4 UI). */
export function trackHoroFunnelStep(payload: HoroFunnelStepPayload) {
  capturePostHogEvent('horo_funnel_step', {
    hypothesis_segment: HYPOTHESIS_PRIMARY_SEGMENT,
    funnel_step: payload.step,
    target: payload.target,
    ...(payload.compact_home !== undefined ? { compact_home: payload.compact_home } : {}),
  });
  gtagEvent('horo_funnel_step', {
    hypothesis_segment: HYPOTHESIS_PRIMARY_SEGMENT,
    funnel_step: payload.step,
    target: payload.target,
    ...(payload.compact_home !== undefined ? { compact_home: payload.compact_home ? 1 : 0 } : {}),
  });
}

export function trackHomeView(extra: { compact_home: boolean }) {
  capturePostHogEvent('horo_home_view', {
    hypothesis_segment: HYPOTHESIS_PRIMARY_SEGMENT,
    compact_home: extra.compact_home,
  });
  gtagEvent('horo_home_view', {
    hypothesis_segment: HYPOTHESIS_PRIMARY_SEGMENT,
    compact_home: extra.compact_home ? 1 : 0,
  });
}

const SCROLL_STORAGE_KEY = 'horo_home_scroll_milestones';

function loadMilestones(): Set<number> {
  if (typeof sessionStorage === 'undefined') return new Set();
  try {
    const raw = sessionStorage.getItem(SCROLL_STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as number[]);
  } catch {
    return new Set();
  }
}

function saveMilestones(set: Set<number>) {
  sessionStorage.setItem(SCROLL_STORAGE_KEY, JSON.stringify([...set]));
}

/** Fire once per session per milestone (25 / 50 / 75 / 90). */
export function trackHomeScrollMilestone(percentBucket: number, compact_home: boolean) {
  const milestones = loadMilestones();
  if (milestones.has(percentBucket)) return;
  milestones.add(percentBucket);
  saveMilestones(milestones);
  capturePostHogEvent('horo_home_scroll', {
    hypothesis_segment: HYPOTHESIS_PRIMARY_SEGMENT,
    scroll_depth_bucket: percentBucket,
    compact_home,
  });
  gtagEvent('horo_home_scroll', {
    hypothesis_segment: HYPOTHESIS_PRIMARY_SEGMENT,
    scroll_depth_bucket: percentBucket,
    compact_home: compact_home ? 1 : 0,
  });
}

/* ─── Browse page view tracking (once-per-session per page type) ──────── */

const BROWSE_VIEW_PREFIX = 'horo_browse_view_v1:';

function trackBrowsePageViewOnce(
  pageType: string,
  properties: Record<string, string | number | boolean | undefined> = {},
) {
  if (typeof window === 'undefined') return;
  const key = `${BROWSE_VIEW_PREFIX}${pageType}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
  } catch {
    /* ignore */
  }
  capturePostHogEvent(`horo_${pageType}_view`, {
    hypothesis_segment: HYPOTHESIS_PRIMARY_SEGMENT,
    ...properties,
  });
  gtagEvent(`horo_${pageType}_view`, {
    hypothesis_segment: HYPOTHESIS_PRIMARY_SEGMENT,
    ...(Object.fromEntries(
      Object.entries(properties).filter(([, v]) => v !== undefined),
    ) as Record<string, string | number>),
  });
}

/** Feelings hub — `/feelings` */
export function trackFeelingsHubView(feelingCount: number) {
  trackBrowsePageViewOnce('feelings_hub', { feeling_count: feelingCount });
}

/** Occasions hub — `/occasions` */
export function trackOccasionsHubView(occasionCount: number) {
  trackBrowsePageViewOnce('occasions_hub', { occasion_count: occasionCount });
}

/** Shop All — `/products` */
export function trackShopAllView(productCount: number) {
  trackBrowsePageViewOnce('shop_all', { product_count: productCount });
}

/** Single feeling collection — `/feelings/:slug` */
export function trackFeelingCollectionView(feelingSlug: string, productCount: number) {
  trackBrowsePageViewOnce(`feeling_${feelingSlug}`, {
    feeling_slug: feelingSlug,
    product_count: productCount,
  });
}

/** Single occasion collection — `/occasions/:slug` */
export function trackOccasionCollectionView(occasionSlug: string, productCount: number) {
  trackBrowsePageViewOnce(`occasion_${occasionSlug}`, {
    occasion_slug: occasionSlug,
    product_count: productCount,
  });
}

/** Search results viewed with a query */
export function trackSearchView(query: string, resultCount: number) {
  if (!query.trim()) return;
  capturePostHogEvent('horo_search_view', {
    hypothesis_segment: HYPOTHESIS_PRIMARY_SEGMENT,
    search_query: query.trim().slice(0, 100),
    result_count: resultCount,
  });
  gtagEvent('horo_search_view', {
    hypothesis_segment: HYPOTHESIS_PRIMARY_SEGMENT,
    search_query: query.trim().slice(0, 100),
    result_count: resultCount,
  });
}

