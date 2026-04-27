import { onCLS, onINP, onLCP, type Metric } from 'web-vitals';
import { capturePostHogEvent, isPostHogConfigured } from '@/lib/posthog-client';

/** Sends CWV samples to GA4 (when available) and PostHog. */
export function initWebVitalsReporting() {
  if (typeof window === 'undefined') return;

  const send = (metric: Metric) => {
    const value = metric.name === 'CLS' ? Math.round(metric.value * 1000) : Math.round(metric.value);
    const delta =
      metric.name === 'CLS' ? Math.round(metric.delta * 1000) : Math.round(metric.delta);

    // GA4 path (only when gtag is loaded)
    if (window.gtag) {
      window.gtag('event', 'web_vitals', {
        metric_name: metric.name,
        value,
        metric_id: metric.id,
        metric_delta: delta,
        non_interaction: true,
      });
    }

    // PostHog path (independent of GA4)
    if (isPostHogConfigured()) {
      capturePostHogEvent('$web_vitals', {
        metric_name: metric.name,
        value,
        metric_id: metric.id,
        metric_delta: delta,
        rating: metric.rating,
      });
    }
  };

  onCLS(send);
  onINP(send);
  onLCP(send);
}
