/**
 * Funnel event tracker regression tests.
 * Verifies that hero-CTA, gift-route, WhatsApp, and COD-confirmed events
 * fire correctly across PostHog, GA4, and Meta Pixel.
 */

import {
  trackHeroCtaClick,
  trackGiftRouteClick,
  trackWhatsAppClick,
  trackCodConfirmed,
} from '../events';

const mockGtag = jest.fn();
const mockFbq = jest.fn();
const mockPostHog = jest.fn();

jest.mock('@/lib/posthog-client', () => ({
  capturePostHogEvent: (...args: unknown[]) => mockPostHog(...args),
}));

beforeAll(() => {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      gtag: mockGtag,
      fbq: mockFbq,
    },
  });
  Object.defineProperty(globalThis, 'process', {
    configurable: true,
    value: {
      env: {
        NEXT_PUBLIC_GA_MEASUREMENT_ID: 'G-TEST123',
        NEXT_PUBLIC_META_PIXEL_ID: '123456789',
      },
    },
  });
});

beforeEach(() => {
  mockGtag.mockClear();
  mockFbq.mockClear();
  mockPostHog.mockClear();
});

afterAll(() => {
  // @ts-expect-error deleting test-only browser shim
  delete globalThis.window;
  // @ts-expect-error deleting test-only process shim
  delete globalThis.process;
});

describe('trackHeroCtaClick', () => {
  it('fires PostHog, GA4, and Meta events with correct payload', () => {
    trackHeroCtaClick('Shop Now', '/products', 'variant-a');

    expect(mockPostHog).toHaveBeenCalledTimes(1);
    expect(mockPostHog).toHaveBeenCalledWith('hero_cta_click', expect.objectContaining({
      cta_label: 'Shop Now',
      cta_href: '/products',
      hero_variant: 'variant-a',
      hypothesis_segment: 'cold_discovery',
    }));

    expect(mockGtag).toHaveBeenCalledTimes(1);
    expect(mockGtag).toHaveBeenCalledWith('event', 'hero_cta_click', expect.objectContaining({
      cta_label: 'Shop Now',
      cta_href: '/products',
      hero_variant: 'variant-a',
    }));

    expect(mockFbq).toHaveBeenCalledTimes(1);
    expect(mockFbq).toHaveBeenCalledWith('trackCustom', 'HeroCtaClick', expect.objectContaining({
      cta_label: 'Shop Now',
      hero_variant: 'variant-a',
    }));
  });

  it('uses "default" variant when none is provided', () => {
    trackHeroCtaClick('Browse', '/feelings');

    expect(mockPostHog).toHaveBeenCalledWith(
      'hero_cta_click',
      expect.objectContaining({ hero_variant: 'default' }),
    );
  });
});

describe('trackGiftRouteClick', () => {
  it('fires all three analytics platforms with gift route data', () => {
    trackGiftRouteClick('home_primary_routes');

    expect(mockPostHog).toHaveBeenCalledTimes(1);
    expect(mockPostHog).toHaveBeenCalledWith('gift_route_click', expect.objectContaining({
      buyer_route: 'gift',
      source: 'home_primary_routes',
      content_job: 'desire',
    }));

    expect(mockGtag).toHaveBeenCalledTimes(1);
    expect(mockGtag).toHaveBeenCalledWith('event', 'gift_route_click', expect.objectContaining({
      buyer_route: 'gift',
      source: 'home_primary_routes',
    }));

    expect(mockFbq).toHaveBeenCalledTimes(1);
    expect(mockFbq).toHaveBeenCalledWith('trackCustom', 'GiftRouteClick', expect.objectContaining({
      buyer_route: 'gift',
      source: 'home_primary_routes',
    }));
  });
});

describe('trackWhatsAppClick', () => {
  it('tracks size_help purpose with correct location', () => {
    trackWhatsAppClick('size_help', 'pdp_buy_box');

    expect(mockPostHog).toHaveBeenCalledWith('whatsapp_clicked', expect.objectContaining({
      whatsapp_purpose: 'size_help',
      location: 'pdp_buy_box',
      content_job: 'trust',
    }));

    expect(mockGtag).toHaveBeenCalledWith('event', 'whatsapp_clicked', expect.objectContaining({
      whatsapp_purpose: 'size_help',
      location: 'pdp_buy_box',
    }));
  });

  it('tracks order_tracking purpose', () => {
    trackWhatsAppClick('order_tracking', 'order_surface');

    expect(mockPostHog).toHaveBeenCalledWith('whatsapp_clicked', expect.objectContaining({
      whatsapp_purpose: 'order_tracking',
      location: 'order_surface',
    }));
  });
});

describe('trackCodConfirmed', () => {
  it('fires cod_confirmed events with order and method', () => {
    trackCodConfirmed('order_123', 'whatsapp');

    expect(mockPostHog).toHaveBeenCalledWith('cod_confirmed', expect.objectContaining({
      order_id: 'order_123',
      confirmation_method: 'whatsapp',
      payment_method: 'cod',
      content_job: 'action',
    }));

    expect(mockGtag).toHaveBeenCalledWith('event', 'cod_confirmed', expect.objectContaining({
      order_id: 'order_123',
      confirmation_method: 'whatsapp',
    }));

    expect(mockFbq).toHaveBeenCalledWith('trackCustom', 'CODConfirmed', expect.objectContaining({
      order_id: 'order_123',
      confirmation_method: 'whatsapp',
    }));
  });
});

describe('SSR safety', () => {
  it('returns early when window is undefined', () => {
    const originalWindow = (globalThis as unknown as { window?: object }).window;
    // @ts-expect-error deleting test-only browser shim
    delete globalThis.window;

    trackHeroCtaClick('Test', '/test');
    trackGiftRouteClick('test');
    trackWhatsAppClick('general', 'test');
    trackCodConfirmed('order_1', 'whatsapp');

    expect(mockPostHog).not.toHaveBeenCalled();
    expect(mockGtag).not.toHaveBeenCalled();
    expect(mockFbq).not.toHaveBeenCalled();

    // restore
    (globalThis as unknown as { window?: object }).window = originalWindow;
  });
});
