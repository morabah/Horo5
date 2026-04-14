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
  gtagEvent('horo_funnel_step', {
    hypothesis_segment: HYPOTHESIS_PRIMARY_SEGMENT,
    funnel_step: payload.step,
    target: payload.target,
    ...(payload.compact_home !== undefined ? { compact_home: payload.compact_home ? 1 : 0 } : {}),
  });
}

export function trackHomeView(extra: { compact_home: boolean }) {
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
  gtagEvent('horo_home_scroll', {
    hypothesis_segment: HYPOTHESIS_PRIMARY_SEGMENT,
    scroll_depth_bucket: percentBucket,
    compact_home: compact_home ? 1 : 0,
  });
}
