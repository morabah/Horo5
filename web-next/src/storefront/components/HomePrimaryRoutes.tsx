'use client';

import Link from 'next/link';

import {
  pickLocalizedStorefrontText,
  type StorefrontHomepageSection,
} from '../data/catalog-types';
import { HOME_PRIMARY_ROUTES } from '../data/homeContent';
import {
  getFeelingCollectionVisual,
  heroVectorizedV2,
  imgUrl,
} from '../data/images';
import { getProduct, getProducts } from '../data/site';
import { useUiLocale, useDictionary } from '../i18n/ui-locale';

type CollectionRouteItem = {
  key: string;
  title: string;
  body: string;
  href: string;
  productHandle?: string;
  accent: string;
  imageSrc?: string;
};

const PRODUCT_CANDIDATES_BY_ROUTE_KEY: Record<string, readonly string[]> = {
  walk_alone: ['quiet-revolt', 'walk-alone', 'walk-alone-tee'],
  i_care: ['the-weight-of-light', 'i-care', 'emotions-silent-scream'],
  i_dont_care: ['trends-next-wave', 'next-wave', 'i-dont-care', 'emotions-raw-nerve', 'emotions-shattered-peace'],
};

const ROUTE_COPY_KEYS = {
  founding_drop: {
    titleKey: 'routesFoundingDropLabel' as const,
    bodyKey: 'routesFoundingDropBlurb' as const,
  },
  zodiac: {
    titleKey: 'routesZodiacLabel' as const,
    bodyKey: 'routesZodiacBlurb' as const,
  },
  mood_lifestyle: {
    titleKey: 'routesMoodLifestyleLabel' as const,
    bodyKey: 'routesMoodLifestyleBlurb' as const,
  },
  walk_alone: {
    titleKey: 'routesWalkAloneLabel' as const,
    bodyKey: 'routesWalkAloneBlurb' as const,
  },
  i_care: {
    titleKey: 'routesICareLabel' as const,
    bodyKey: 'routesICareBlurb' as const,
  },
  i_dont_care: {
    titleKey: 'routesIDontCareLabel' as const,
    bodyKey: 'routesIDontCareBlurb' as const,
  },
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function localizedPayloadText(value: unknown, locale: 'en' | 'ar') {
  if (typeof value !== 'string' && !isRecord(value)) return undefined;
  return pickLocalizedStorefrontText(
    typeof value === 'string' ? value : (value as Parameters<typeof pickLocalizedStorefrontText>[0]),
    locale,
  );
}

function getRouteVisual(routeKey: string) {
  if (routeKey === 'zodiac') {
    const visual = getFeelingCollectionVisual('zodiac');
    const src = visual.cover.src || visual.hero.src || visual.proof.src;
    return src && src !== heroVectorizedV2 ? src : '';
  }
  return '';
}

function routeDesignSlug(route: Pick<CollectionRouteItem, 'key' | 'href'>): string | null {
  const normalizedKey = route.key.replace(/_/g, '-');
  if (normalizedKey === 'walk-alone' || normalizedKey === 'i-care' || normalizedKey === 'i-dont-care') {
    return normalizedKey;
  }

  try {
    const url = new URL(route.href, 'https://horo.local');
    const category = url.searchParams.get('category')?.trim();
    if (category) return category;
  } catch {
    return null;
  }

  return null;
}

function productHandleFromHref(href: string): string | null {
  try {
    const url = new URL(href, 'https://horo.local');
    const match = url.pathname.match(/^\/products\/([^/?#]+)$/);
    return match ? decodeURIComponent(match[1] ?? '') : null;
  } catch {
    return null;
  }
}

function resolveRouteProductHandle(route: CollectionRouteItem): string | null {
  if (route.productHandle) {
    const product = getProduct(route.productHandle);
    return product?.slug ?? route.productHandle;
  }

  const hrefHandle = productHandleFromHref(route.href);
  if (hrefHandle) {
    const product = getProduct(hrefHandle);
    return product?.slug ?? hrefHandle;
  }

  for (const candidate of PRODUCT_CANDIDATES_BY_ROUTE_KEY[route.key] ?? []) {
    const product = getProduct(candidate);
    if (product) return product.slug;
  }

  const designSlug = routeDesignSlug(route);
  if (!designSlug) return null;

  const matches = getProducts().filter((product) => {
    return (
      product.slug === designSlug ||
      product.launchDesign === designSlug ||
      product.primarySubfeelingSlug === designSlug ||
      product.lineSlug === designSlug
    );
  });

  return matches.length === 1 ? matches[0]?.slug ?? null : null;
}

function isCategoryFilterHref(href: string): boolean {
  try {
    const url = new URL(href, 'https://horo.local');
    return url.pathname === '/products' && Boolean(url.searchParams.get('category'));
  } catch {
    return false;
  }
}

function resolveRouteTarget(route: CollectionRouteItem): { href: string; isProduct: boolean } {
  const productHandle = resolveRouteProductHandle(route);
  if (productHandle) {
    return { href: `/products/${productHandle}`, isProduct: true };
  }

  return {
    href: isCategoryFilterHref(route.href) ? '/products' : route.href,
    isProduct: false,
  };
}

function routesFromSection(section: StorefrontHomepageSection | undefined, locale: 'en' | 'ar'): CollectionRouteItem[] {
  const payload = isRecord(section?.payload) ? section.payload : null;
  const rawItems = Array.isArray(payload?.items) ? payload.items : [];
  const fromPayload = rawItems.flatMap((item, index): CollectionRouteItem[] => {
    if (!isRecord(item)) return [];
    const keyValue = item.key ?? item.slug ?? `route-${index}`;
    const key = typeof keyValue === 'string' ? keyValue.trim() : `route-${index}`;
    const title = localizedPayloadText(item.label ?? item.title ?? item.name, locale);
    const body = localizedPayloadText(item.subtitle ?? item.body ?? item.tagline, locale);
    const href = typeof item.href === 'string' && item.href.trim() ? item.href.trim() : '/products';
    const productHandleValue = item.productHandle ?? item.product_handle ?? item.productSlug ?? item.product_slug;
    const productHandle =
      typeof productHandleValue === 'string' && productHandleValue.trim()
        ? productHandleValue.trim()
        : undefined;
    const accent = typeof item.accent === 'string' && item.accent.trim() ? item.accent.trim() : '#4F111F';
    const imageSrc =
      typeof item.imageSrc === 'string' && item.imageSrc.trim()
        ? item.imageSrc.trim()
        : typeof item.image_src === 'string' && item.image_src.trim()
          ? item.image_src.trim()
          : undefined;
    if (!title) return [];
    return [{ key, title, body: body ?? '', href, productHandle, accent, imageSrc }];
  });

  if (fromPayload.length > 0) return fromPayload.slice(0, 3);
  return [];
}

export function HomePrimaryRoutes({ section }: { section?: StorefrontHomepageSection }) {
  const copy = useDictionary();
  const { locale } = useUiLocale();
  const cmsRoutes = routesFromSection(section, locale as 'en' | 'ar');
  const fallbackRoutes = HOME_PRIMARY_ROUTES.map((route) => {
    const routeCopy = ROUTE_COPY_KEYS[route.key as keyof typeof ROUTE_COPY_KEYS] ?? ROUTE_COPY_KEYS.founding_drop;
    return {
      key: route.key,
      title: copy.home[routeCopy.titleKey],
      body: copy.home[routeCopy.bodyKey],
      href: route.href,
      productHandle: route.productHandle,
      accent: route.accent,
      imageSrc: getRouteVisual(route.key) || undefined,
    };
  });
  const routes = cmsRoutes.length > 0 ? cmsRoutes : fallbackRoutes;

  return (
    <section
      id="collection-trio"
      aria-labelledby="home-primary-routes-title"
      className="home-section bg-horo-white px-0 py-0 sm:px-0"
    >
      <h2 id="home-primary-routes-title" className="sr-only">
        {copy.shell.shopHeading}
      </h2>
      <div className="mx-auto max-w-[1920px]">
        <div className="grid gap-0 md:grid-cols-3">
          {routes.map((route) => {
            const imageSrc = route.imageSrc || getRouteVisual(route.key);
            const target = resolveRouteTarget(route);

            return (
              <Link
                key={route.key}
                href={target.href}
                className="home-collection-card group relative isolate flex min-h-[220px] overflow-hidden bg-horo-root text-horo-breath transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-horo-pulse sm:min-h-[280px] md:min-h-[360px]"
                data-reveal
                style={{ backgroundColor: imageSrc ? undefined : route.accent }}
              >
                {imageSrc ? (
                  <img
                    src={imgUrl(imageSrc, 1200)}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    aria-hidden
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                ) : null}
                <span
                  aria-hidden
                  className="absolute inset-0 bg-linear-to-t from-horo-root/92 via-horo-root/48 to-horo-root/18"
                />
                <span className="relative mt-auto flex w-full flex-col gap-2 p-6 md:p-8">
                  <span className="font-headline text-[1.5rem] font-semibold uppercase leading-none tracking-[0.04em] md:text-[1.85rem]">
                    {route.title}
                  </span>
                  {route.body ? (
                    <span className="font-body max-w-[18rem] text-[14px] leading-snug text-horo-breath/88 md:text-[15px]">
                      {route.body}
                    </span>
                  ) : null}
                  <span className="font-label mt-2 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-horo-breath/92">
                    {target.isProduct ? (locale === 'ar' ? 'شاهد القطعة' : 'View piece') : (locale === 'ar' ? 'استكشف' : 'Explore')}
                    <span aria-hidden>→</span>
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
