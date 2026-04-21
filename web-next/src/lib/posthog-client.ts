import posthog from "posthog-js";

export const posthogClient = posthog;

let postHogInitialized = false;

type BrowserPostHog = typeof posthog & {
  __loaded?: boolean;
};

function getBrowserPostHog() {
  if (typeof window === "undefined") return posthog;
  return ((window as typeof window & { posthog?: BrowserPostHog }).posthog ?? posthog) as BrowserPostHog;
}

export function isPostHogConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim());
}

export function ensurePostHogInitialized() {
  if (postHogInitialized) return true;
  if (typeof window === "undefined") return false;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  if (!key) return false;

  const client = getBrowserPostHog();
  if (client.__loaded) {
    postHogInitialized = true;
    return true;
  }

  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    defaults: "2026-01-30",
    person_profiles: "identified_only",
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: true,
  });

  postHogInitialized = true;
  return true;
}

export function capturePostHogEvent(eventName: string, properties: Record<string, unknown> = {}) {
  if (!ensurePostHogInitialized()) return;

  try {
    getBrowserPostHog().capture(eventName, properties);
  } catch {
    /* Analytics must never block storefront interactions. */
  }
}
