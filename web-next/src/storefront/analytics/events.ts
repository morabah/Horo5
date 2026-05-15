import { capturePostHogEvent } from '@/lib/posthog-client';
import type { CartLine } from '../cart/types';
import { getFeeling, getOccasion, getProduct, type Product, type ProductSizeKey } from '../data/site';
import {
  HYPOTHESIS_PRIMARY_SEGMENT,
  deriveBuyerRoute,
  deriveFirstWedgeEligible,
  deriveGiftIntent,
  deriveHypothesisSegment,
  DEFAULT_CONTENT_JOB_BY_EVENT,
} from './hypothesisContext';

type AnalyticsItemContext = {
  occasionSlug?: string;
  size?: ProductSizeKey;
  contentJob?: string;
  assetType?: string;
};

const RECENT_EVENT_WINDOW_MS = 1200;
const PURCHASE_EVENT_STORAGE_PREFIX = 'horo-analytics-purchase-v1:';
const recentEvents = new Map<string, number>();

type PostHogCommerceEventName =
  | 'commerce_product_viewed'
  | 'commerce_size_selected'
  | 'commerce_cart_viewed'
  | 'commerce_add_to_cart'
  | 'commerce_checkout_started'
  | 'commerce_checkout_submitted'
  | 'commerce_payment_method_selected'
  | 'commerce_order_completed'
  | 'commerce_wishlist_add'
  | 'commerce_wishlist_remove';

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
  const feeling = getFeeling(product.primaryFeelingSlug ?? product.feelingSlug);
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
    buyer_route: deriveBuyerRoute(product),
    primary_audience: deriveHypothesisSegment(product),
    gift_intent: deriveGiftIntent(product),
    first_wedge_eligible: deriveFirstWedgeEligible(product),
    content_job: context.contentJob ?? 'desire',
    asset_type: context.assetType ?? 'pdp',
  };
}

function capturePostHogCommerceEvent(
  eventName: PostHogCommerceEventName,
  properties: Record<string, unknown>,
  product?: Product | null,
) {
  if (typeof window === 'undefined') return;
  const segment = product ? deriveHypothesisSegment(product) : HYPOTHESIS_PRIMARY_SEGMENT;
  const contentJob = DEFAULT_CONTENT_JOB_BY_EVENT[eventName] ?? 'desire';
  capturePostHogEvent(eventName, {
    ...properties,
    commerce_event: eventName,
    hypothesis_segment: segment,
    content_job: (properties.content_job as string | undefined) ?? contentJob,
    ...(product ? { asset_type: 'pdp', buyer_route: deriveBuyerRoute(product) } : {}),
  });
}

function shouldSuppressTrackedPurchase(transactionId: string) {
  if (shouldSuppressDuplicateEvent('purchase', transactionId)) return true;
  if (typeof window === 'undefined') return false;

  try {
    const key = `${PURCHASE_EVENT_STORAGE_PREFIX}${transactionId}`;
    if (window.sessionStorage.getItem(key)) return true;
    window.sessionStorage.setItem(key, String(Date.now()));
  } catch {
    /* ignore */
  }

  return false;
}

export function createViewItemPayload(product: Product) {
  return {
    currency: 'EGP',
    value: product.priceEgp,
    items: [buildAnalyticsItem(product, 1)],
  };
}

function createCartPayload(lines: CartLine[], subtotalEgp: number, giftWrapEgp: number) {
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
    item_count: lines.reduce((s, l) => s + l.qty, 0),
    line_count: lines.length,
    items,
  };
}

export function createAddToCartPayload(product: Product, quantity: number, size: ProductSizeKey) {
  return {
    currency: 'EGP',
    value: product.priceEgp * quantity,
    items: [buildAnalyticsItem(product, quantity, { size })],
  };
}

export function createSizeSelectedPayload(product: Product, size: ProductSizeKey, source: string) {
  const variant = product.variantsBySize?.[size];
  const value = variant?.priceEgp ?? product.priceEgp;
  return {
    currency: 'EGP',
    value,
    source,
    product_slug: product.slug,
    product_name: product.name,
    size,
    item: buildAnalyticsItem(product, 1, { size }),
  };
}

export function createBeginCheckoutPayload(lines: CartLine[], subtotalEgp: number, giftWrapEgp: number) {
  const payload = createCartPayload(lines, subtotalEgp, giftWrapEgp);
  return {
    currency: payload.currency,
    value: payload.value,
    items: payload.items,
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

export function trackViewItem(product: Product, assetType?: string) {
  if (typeof window === 'undefined') return;
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
  if (shouldSuppressDuplicateEvent('view_item', product.slug)) return;
  const payload = createViewItemPayload(product);

  capturePostHogCommerceEvent('commerce_product_viewed', payload, product);

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
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
  const payload = createAddToCartPayload(product, quantity, size);
  capturePostHogCommerceEvent('commerce_add_to_cart', {
    ...payload,
    product_slug: product.slug,
    product_name: product.name,
    size,
    quantity,
    item_count: quantity,
  }, product);
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

export function trackCartViewed(lines: CartLine[], subtotalEgp: number, giftWrapEgp: number) {
  if (typeof window === 'undefined') return;
  const payload = createCartPayload(lines, subtotalEgp, giftWrapEgp);
  if (payload.items.length === 0) return;

  capturePostHogCommerceEvent('commerce_cart_viewed', payload);
}

export function trackSizeSelected(product: Product, size: ProductSizeKey, source = 'pdp') {
  if (typeof window === 'undefined') return;
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  const payload = createSizeSelectedPayload(product, size, source);

  capturePostHogCommerceEvent('commerce_size_selected', payload, product);

  if (window.gtag && gaId) {
    window.gtag('event', 'size_selected', { ...payload, hypothesis_segment: HYPOTHESIS_PRIMARY_SEGMENT });
  }
}

export function trackBeginCheckout(lines: CartLine[], subtotalEgp: number, giftWrapEgp: number) {
  if (typeof window === 'undefined') return;
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
  const payload = createBeginCheckoutPayload(lines, subtotalEgp, giftWrapEgp);

  if (payload.items.length === 0) return;

  capturePostHogCommerceEvent('commerce_checkout_started', {
    ...createCartPayload(lines, subtotalEgp, giftWrapEgp),
  });

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

export function trackCheckoutSubmitted(payload: {
  lines: CartLine[];
  subtotalEgp: number;
  giftWrapEgp: number;
  paymentMethodKind?: string;
  shippingEgp?: number;
}) {
  if (typeof window === 'undefined') return;
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
  const cartPayload = createCartPayload(payload.lines, payload.subtotalEgp, payload.giftWrapEgp);
  if (cartPayload.items.length === 0) return;

  capturePostHogCommerceEvent('commerce_checkout_submitted', {
    ...cartPayload,
    ...(payload.paymentMethodKind ? { payment_method_kind: payload.paymentMethodKind } : {}),
    ...(typeof payload.shippingEgp === 'number' ? { shipping: payload.shippingEgp } : {}),
  });

  if (window.gtag && gaId) {
    window.gtag('event', 'checkout_submitted', {
      ...cartPayload,
      hypothesis_segment: HYPOTHESIS_PRIMARY_SEGMENT,
    });
  }
  if (window.fbq && pixelId) {
    window.fbq('trackCustom', 'CheckoutSubmitted', {
      value: cartPayload.value,
      currency: 'EGP',
      content_ids: payload.lines.map((l) => l.productSlug),
    });
  }
}

export function trackPaymentMethodSelected(payload: {
  paymentMethodKind: string;
  paymentMethodProviderId?: string;
  source?: string;
}) {
  if (typeof window === 'undefined') return;
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();

  capturePostHogCommerceEvent('commerce_payment_method_selected', {
    payment_method_kind: payload.paymentMethodKind,
    ...(payload.paymentMethodProviderId ? { payment_method_provider_id: payload.paymentMethodProviderId } : {}),
    source: payload.source ?? 'checkout',
  });

  if (window.gtag && gaId) {
    window.gtag('event', 'payment_method_selected', {
      payment_method_kind: payload.paymentMethodKind,
      hypothesis_segment: HYPOTHESIS_PRIMARY_SEGMENT,
    });
  }
  if (window.fbq && pixelId) {
    window.fbq('trackCustom', 'PaymentMethodSelected', {
      payment_method_kind: payload.paymentMethodKind,
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
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
  const eventPayload = createPurchasePayload(payload);

  if (eventPayload.items.length === 0) return;
  if (shouldSuppressTrackedPurchase(payload.transactionId)) return;

  capturePostHogCommerceEvent('commerce_order_completed', {
    ...eventPayload,
    item_count: payload.lines.reduce((s, l) => s + l.qty, 0),
    line_count: payload.lines.length,
  });

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

export function trackWishlistAdd(product: Product) {
  if (typeof window === 'undefined') return;
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  capturePostHogCommerceEvent('commerce_wishlist_add', {
    currency: 'EGP',
    value: product.priceEgp,
    product_slug: product.slug,
    product_name: product.name,
    items: [buildAnalyticsItem(product, 1)],
  }, product);
  if (window.gtag && gaId) {
    window.gtag('event', 'add_to_wishlist', {
      currency: 'EGP',
      value: product.priceEgp,
      items: [buildAnalyticsItem(product, 1)],
      hypothesis_segment: HYPOTHESIS_PRIMARY_SEGMENT,
    });
  }
}

export function trackWishlistRemove(product: Product) {
  if (typeof window === 'undefined') return;
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  capturePostHogCommerceEvent('commerce_wishlist_remove', {
    currency: 'EGP',
    value: product.priceEgp,
    product_slug: product.slug,
    product_name: product.name,
    items: [buildAnalyticsItem(product, 1)],
  }, product);
  if (window.gtag && gaId) {
    window.gtag('event', 'remove_from_wishlist', {
      currency: 'EGP',
      value: product.priceEgp,
      items: [buildAnalyticsItem(product, 1)],
      hypothesis_segment: HYPOTHESIS_PRIMARY_SEGMENT,
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

/** Hero CTA clicked — primary, secondary, or tertiary (Drop · Feeling · Gift) */
export function trackHeroCtaClick(ctaLabel: string, ctaHref: string, variant?: string) {
  if (typeof window === 'undefined') return;
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();

  capturePostHogEvent('hero_cta_click', {
    hypothesis_segment: HYPOTHESIS_PRIMARY_SEGMENT,
    cta_label: ctaLabel,
    cta_href: ctaHref,
    hero_variant: variant ?? 'default',
  });

  if (window.gtag && gaId) {
    window.gtag('event', 'hero_cta_click', {
      cta_label: ctaLabel,
      cta_href: ctaHref,
      hero_variant: variant ?? 'default',
      hypothesis_segment: HYPOTHESIS_PRIMARY_SEGMENT,
    });
  }
  if (window.fbq && pixelId) {
    window.fbq('trackCustom', 'HeroCtaClick', {
      cta_label: ctaLabel,
      hero_variant: variant ?? 'default',
    });
  }
}

/** Gift route clicked from home primary routes */
export function trackGiftRouteClick(source: string) {
  if (typeof window === 'undefined') return;
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();

  capturePostHogEvent('gift_route_click', {
    hypothesis_segment: HYPOTHESIS_PRIMARY_SEGMENT,
    buyer_route: 'gift',
    source,
    content_job: 'desire',
    asset_type: 'home',
  });

  if (window.gtag && gaId) {
    window.gtag('event', 'gift_route_click', {
      buyer_route: 'gift',
      source,
      hypothesis_segment: HYPOTHESIS_PRIMARY_SEGMENT,
    });
  }
  if (window.fbq && pixelId) {
    window.fbq('trackCustom', 'GiftRouteClick', {
      buyer_route: 'gift',
      source,
    });
  }
}

/** WhatsApp support button clicked (size help, support, order tracking) */
export function trackWhatsAppClick(purpose: 'size_help' | 'support' | 'order_tracking' | 'general', location: string) {
  if (typeof window === 'undefined') return;
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();

  capturePostHogEvent('whatsapp_clicked', {
    hypothesis_segment: HYPOTHESIS_PRIMARY_SEGMENT,
    whatsapp_purpose: purpose,
    location,
    content_job: 'trust',
  });

  if (window.gtag && gaId) {
    window.gtag('event', 'whatsapp_clicked', {
      whatsapp_purpose: purpose,
      location,
      hypothesis_segment: HYPOTHESIS_PRIMARY_SEGMENT,
    });
  }
  if (window.fbq && pixelId) {
    window.fbq('trackCustom', 'WhatsAppClicked', {
      whatsapp_purpose: purpose,
      location,
    });
  }
}

/** COD order confirmed by admin / WhatsApp — tracked on order confirmation page */
export function trackCodConfirmed(orderId: string, confirmationMethod: 'whatsapp' | 'manual_admin') {
  if (typeof window === 'undefined') return;
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();

  capturePostHogEvent('cod_confirmed', {
    hypothesis_segment: HYPOTHESIS_PRIMARY_SEGMENT,
    order_id: orderId,
    confirmation_method: confirmationMethod,
    payment_method: 'cod',
    content_job: 'action',
  });

  if (window.gtag && gaId) {
    window.gtag('event', 'cod_confirmed', {
      order_id: orderId,
      confirmation_method: confirmationMethod,
      hypothesis_segment: HYPOTHESIS_PRIMARY_SEGMENT,
    });
  }
  if (window.fbq && pixelId) {
    window.fbq('trackCustom', 'CODConfirmed', {
      order_id: orderId,
      confirmation_method: confirmationMethod,
    });
  }
}

/** GA4 custom event when a debounced search returns zero designs, vibes, and occasions. */
export function trackSearchZeroResults(payload: SearchZeroResultsPayload) {
  if (typeof window === 'undefined') return;
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  capturePostHogEvent('search_zero_results', {
    ...payload,
    hypothesis_segment: HYPOTHESIS_PRIMARY_SEGMENT,
  });
  if (window.gtag && gaId) {
    window.gtag('event', 'search_zero_results', { ...payload, hypothesis_segment: HYPOTHESIS_PRIMARY_SEGMENT });
  }
}
