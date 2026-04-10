type EventPayload = Record<string, unknown> & {
  event: string;
};

const context = {
  hypothesis: "headless-shopify-custom-design",
  userStory: "merchant-runs-custom-storefront-with-managed-checkout",
};

export function trackEvent(payload: EventPayload): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({
    ...context,
    ...payload,
  });
}

declare global {
  interface Window {
    dataLayer: Array<Record<string, unknown>>;
  }
}
