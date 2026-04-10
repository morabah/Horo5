import type { CartLine } from '../cart/types';
import { getFeeling, getOccasion, getProduct, type Product, type ProductSizeKey } from '../data/site';
import { HYPOTHESIS_PRIMARY_SEGMENT } from './hypothesisContext';

type AnalyticsItemContext = {
  occasionSlug?: string;
  size?: ProductSizeKey;
};

const RECENT_EVENT_WINDOW_MS = 1200;
const recentEvents = new Map<string, number>();

function buildEventKey(name: string, key: string) {
  return `${name}:${key}`;
}

export function shouldSuppressDuplicateEvent(name: string, key: string, now = Date.now()) {
  const eventKey = buildEventKey(name, key);
  const lastSeen = recentEvents.get(eventKey);
  recentEvents.set(eventKey, now);

  for (const [entryKey, timestamp] of recentEvents) {
    if (now - timestamp > RECENT_EVENT_WINDOW_MS * 4) recentEvents.delete(entryKey);
  }

  return lastSeen != null && now - lastSeen < RECENT_EVENT_WINDOW_MS;
}

export function buildAnalyticsItem(product: Product, quantity: number, context: AnalyticsItemContext = {}) {
  const feeling = getFeeling(product.feelingSlug);
  const occasion = getOccasion(context.occasionSlug ?? product.occasionSlugs[0] ?? '');
  return {
    item_id: product.slug,
    item_name: product.name,
    item_brand: 'HORO Egypt',
    ...(feeling ? { item_category: feeling.name } : {}),
    ...(occasion ? { item_category2: occasion.name } : {}),
    ...(context.size ? { item_variant: context.size } : {}),
    price: product.priceEgp,
    quantity,
  };
}

export function createViewItemPayload(product: Product) {
  return {
    currency: 'EGP',
    value: product.priceEgp,
    items: [buildAnalyticsItem(product, 1)],
  };
}

export function createAddToCartPayload(product: Product, quantity: number, size: ProductSizeKey) {
  return {
    currency: 'EGP',
    value: product.priceEgp * quantity,
    items: [buildAnalyticsItem(product, quantity, { size })],
  };
}

export function createBeginCheckoutPayload(lines: CartLine[], subtotalEgp: number, giftWrapEgp: number) {
  const items = lines
    .map((line) => {
      const product = getProduct(line.productSlug);
      if (!product) {
        return {
          item_id: line.variantId ?? line.productSlug,
          item_name: line.productName ?? line.productSlug,
          item_brand: 'HORO Egypt',
          item_variant: line.size,
          price: line.unitPriceEgp ?? 0,
          quantity: line.qty,
        };
      }
      return buildAnalyticsItem(product, line.qty, { size: line.size });
    })
    .filter(Boolean);

  return {
    currency: 'EGP',
    value: subtotalEgp + giftWrapEgp,
    items,
  };
}

export function createPurchasePayload(payload: {
  transactionId: string;
  value: number;
  currency: string;
  lines: CartLine[];
}) {
  const items = payload.lines
    .map((line) => {
      const product = getProduct(line.productSlug);
      if (!product) {
        return {
          item_id: line.variantId ?? line.productSlug,
          item_name: line.productName ?? line.productSlug,
          item_brand: 'HORO Egypt',
          item_variant: line.size,
          price: line.unitPriceEgp ?? 0,
          quantity: line.qty,
        };
      }
      return buildAnalyticsItem(product, line.qty, { size: line.size });
    })
    .filter(Boolean);

  return {
    transaction_id: payload.transactionId,
    value: payload.value,
    currency: payload.currency,
    items,
  };
}

export function trackViewItem(product: Product) {
  if (typeof window === 'undefined') return;
  const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim();
  const pixelId = import.meta.env.VITE_META_PIXEL_ID?.trim();
  if (shouldSuppressDuplicateEvent('view_item', product.slug)) return;
  const payload = createViewItemPayload(product);

  if (window.gtag && gaId) {
    window.gtag('event', 'view_item', { ...payload, hypothesis_segment: HYPOTHESIS_PRIMARY_SEGMENT });
  }
  if (window.fbq && pixelId) {
    window.fbq('track', 'ViewContent', {
      content_ids: [product.slug],
      content_type: 'product',
      value: product.priceEgp,
      currency: 'EGP',
    });
  }
}

export function trackAddToCart(product: Product, quantity: number, size: ProductSizeKey) {
  if (typeof window === 'undefined') return;
  const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim();
  const pixelId = import.meta.env.VITE_META_PIXEL_ID?.trim();
  const payload = createAddToCartPayload(product, quantity, size);
  if (window.gtag && gaId) {
    window.gtag('event', 'add_to_cart', { ...payload, hypothesis_segment: HYPOTHESIS_PRIMARY_SEGMENT });
  }
  if (window.fbq && pixelId) {
    window.fbq('track', 'AddToCart', {
      content_ids: [product.slug],
      content_type: 'product',
      value: payload.value,
      currency: 'EGP',
    });
  }
}

export function trackBeginCheckout(lines: CartLine[], subtotalEgp: number, giftWrapEgp: number) {
  if (typeof window === 'undefined') return;
  const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim();
  const pixelId = import.meta.env.VITE_META_PIXEL_ID?.trim();
  const payload = createBeginCheckoutPayload(lines, subtotalEgp, giftWrapEgp);

  if (payload.items.length === 0) return;

  if (window.gtag && gaId) {
    window.gtag('event', 'begin_checkout', { ...payload, hypothesis_segment: HYPOTHESIS_PRIMARY_SEGMENT });
  }
  if (window.fbq && pixelId) {
    window.fbq('track', 'InitiateCheckout', {
      value: payload.value,
      currency: 'EGP',
      content_ids: lines.map((l) => l.productSlug),
      num_items: lines.reduce((s, l) => s + l.qty, 0),
    });
  }
}

export function trackPurchase(payload: {
  transactionId: string;
  value: number;
  currency: string;
  lines: CartLine[];
}) {
  if (typeof window === 'undefined') return;
  const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim();
  const pixelId = import.meta.env.VITE_META_PIXEL_ID?.trim();
  const eventPayload = createPurchasePayload(payload);

  if (eventPayload.items.length === 0) return;

  if (window.gtag && gaId) {
    window.gtag('event', 'purchase', { ...eventPayload, hypothesis_segment: HYPOTHESIS_PRIMARY_SEGMENT });
  }
  if (window.fbq && pixelId) {
    window.fbq('track', 'Purchase', {
      value: payload.value,
      currency: payload.currency,
      content_ids: payload.lines.map((l) => l.productSlug),
    });
  }
}

export type SearchZeroResultsPayload = {
  search_term: string;
  sort: string;
  price: string;
  vibe_filter: string;
  size: string;
  filter_artist: string;
  filter_occasion: string;
  filter_color: string;
  scope_vibe?: string;
  scope_feeling?: string;
  scope_occasion?: string;
};

/** GA4 custom event when a debounced search returns zero designs, vibes, and occasions. */
export function trackSearchZeroResults(payload: SearchZeroResultsPayload) {
  if (typeof window === 'undefined') return;
  const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim();
  if (window.gtag && gaId) {
    window.gtag('event', 'search_zero_results', { ...payload, hypothesis_segment: HYPOTHESIS_PRIMARY_SEGMENT });
  }
}
