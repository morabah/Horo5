let postHogInitialized = false;
let postHogClientPromise: Promise<PostHogClient> | null = null;

type PostHogClient = typeof import("posthog-js").default;
type BrowserPostHog = PostHogClient & {
  __loaded?: boolean;
};

async function getBrowserPostHog(): Promise<BrowserPostHog | null> {
  if (typeof window === "undefined") return null;

  const existing = (window as typeof window & { posthog?: BrowserPostHog }).posthog;
  if (existing) return existing;

  postHogClientPromise ??= import("posthog-js").then((module) => module.default);
  return postHogClientPromise as Promise<BrowserPostHog>;
}

export function isPostHogConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim());
}

export async function ensurePostHogInitialized() {
  if (postHogInitialized) return true;
  if (typeof window === "undefined") return false;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  if (!key) return false;

  const client = await getBrowserPostHog();
  if (!client) return false;

  if (client.__loaded) {
    postHogInitialized = true;
    return true;
  }

  client.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    defaults: "2026-01-30",
    person_profiles: "identified_only",
    // Manual capture only: $pageview is sent from PostHogPageview, and storefront
    // events live in src/storefront/analytics/events.ts. Autocapture intercepts every
    // click for heuristic event detection — that adds INP cost on mobile.
    capture_pageview: false,
    capture_pageleave: false,
    autocapture: false,
    rageclick: false,
    capture_dead_clicks: false,
    capture_heatmaps: false,
    capture_performance: false,
    disable_session_recording: true,
    disable_surveys: true,
    disable_surveys_automatic_display: true,
    disable_product_tours: true,
    disable_web_experiments: true,
    disable_scroll_properties: true,
    disable_external_dependency_loading: true,
  });

  postHogInitialized = true;
  return true;
}

export function capturePostHogEvent(eventName: string, properties: Record<string, unknown> = {}) {
  void ensurePostHogInitialized()
    .then(async (ready) => {
      if (!ready) return;
      const client = await getBrowserPostHog();
      client?.capture(eventName, properties);
    })
    .catch(() => {
      /* Analytics must never block storefront interactions. */
    });
}
