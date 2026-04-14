import { onCLS, onINP, onLCP, type Metric } from 'web-vitals';

/** Sends CWV samples to GA4 as a custom event when `gtag` is available. */
export function initWebVitalsReporting() {
  if (typeof window === 'undefined' || !window.gtag) return;

  const send = (metric: Metric) => {
    const value = metric.name === 'CLS' ? Math.round(metric.value * 1000) : Math.round(metric.value);
    const delta =
      metric.name === 'CLS' ? Math.round(metric.delta * 1000) : Math.round(metric.delta);
    window.gtag!('event', 'web_vitals', {
      metric_name: metric.name,
      value,
      metric_id: metric.id,
      metric_delta: delta,
      non_interaction: true,
    });
  };

  onCLS(send);
  onINP(send);
  onLCP(send);
}
