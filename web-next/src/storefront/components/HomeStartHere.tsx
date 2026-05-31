import Link from 'next/link';

import { HomeFoundingProductCard } from './home/HomeFoundingProductCard';
import {
  pickLocalizedStorefrontText,
  type StorefrontHomepageSection,
} from '../data/catalog-types';
import { getProductComparisonImageSrc } from '../data/images';
import {
  getProducts,
  productHasRealImage,
  type Product,
} from '../data/site';
import { useUiLocale, useDictionary } from '../i18n/ui-locale';

const NON_COMPARISON_IMAGE_PATTERN = /(?:walking|woman_street|emotions_vibe_3|close|detail|macro|hero-model)/i;
const COMPARISON_IMAGE_PATTERN = /(?:^|[/-])bg_(?:tee|vibe)_/i;

function hasLikelyComparisonImage(product: Product) {
  const src = getProductComparisonImageSrc(product);
  return productHasRealImage(product) && COMPARISON_IMAGE_PATTERN.test(src) && !NON_COMPARISON_IMAGE_PATTERN.test(src);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function payloadProductHandles(section: StorefrontHomepageSection | undefined) {
  const payload = isRecord(section?.payload) ? section.payload : null;
  const raw =
    (Array.isArray(payload?.productHandles) && payload.productHandles) ||
    (Array.isArray(payload?.productSlugs) && payload.productSlugs) ||
    (Array.isArray(payload?.handles) && payload.handles) ||
    (Array.isArray(payload?.products) && payload.products) ||
    (Array.isArray(payload?.items) && payload.items) ||
    [];

  return raw
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      if (!isRecord(item)) return '';
      const value = item.slug ?? item.handle ?? item.productHandle ?? item.productSlug;
      return typeof value === 'string' ? value.trim() : '';
    })
    .filter(Boolean);
}

function payloadLimit(section: StorefrontHomepageSection | undefined) {
  const payload = isRecord(section?.payload) ? section.payload : null;
  const raw = payload?.limit ?? payload?.productLimit;
  const parsed = typeof raw === 'number' || typeof raw === 'string' ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(Math.trunc(parsed), 12) : 5;
}

function resolveHomeProducts(inputProducts: Product[] | undefined, section: StorefrontHomepageSection | undefined) {
  const source = inputProducts && inputProducts.length > 0 ? inputProducts : getProducts();
  const productBySlug = new Map(source.map((product) => [product.slug, product] as const));
  const selected: Product[] = [];
  const seen = new Set<string>();
  const add = (product: Product | undefined) => {
    if (!product || seen.has(product.slug)) return;
    selected.push(product);
    seen.add(product.slug);
  };

  for (const handle of payloadProductHandles(section)) {
    add(productBySlug.get(handle));
  }

  const realImageSource = source.filter(productHasRealImage);
  const comparisonSource = realImageSource.filter(hasLikelyComparisonImage);
  const pool =
    comparisonSource.length >= 4
      ? comparisonSource
      : realImageSource.length >= 4
        ? realImageSource
        : source;
  pool
    .filter((product) => product.merchandisingBadge?.trim() || product.useCase?.trim())
    .forEach(add);
  pool
    .filter((product) => product.fitLabel?.trim() && (product.media?.main || product.thumbnail))
    .forEach(add);
  pool.forEach(add);

  return selected.slice(0, payloadLimit(section));
}

export function HomeStartHere({ products, section }: { products?: Product[]; section?: StorefrontHomepageSection }) {
  const { locale } = useUiLocale();
  const copy = useDictionary();
  const sectionEyebrow = pickLocalizedStorefrontText(section?.eyebrow, locale as 'en' | 'ar');
  const sectionTitle = pickLocalizedStorefrontText(section?.title, locale as 'en' | 'ar');
  const sectionCta = pickLocalizedStorefrontText(section?.primaryCta?.label, locale as 'en' | 'ar');
  const featuredProducts = resolveHomeProducts(products, section);

  if (featuredProducts.length === 0) {
    return null;
  }

  return (
    <section
      id="founding-drop"
      aria-labelledby="home-start-here-title"
      className="home-section border-t border-stone/15 bg-horo-white px-4 py-6 sm:px-6 md:py-7 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="home-section-eyebrow">{sectionEyebrow ?? copy.home.startHereEyebrow}</p>
            <h2 id="home-start-here-title" data-reveal className="home-section-subtitle mt-2">
              {sectionTitle ?? copy.home.startHereTitle}
            </h2>
          </div>
          <Link
            href={section?.primaryCta?.href ?? '/products'}
            className="home-section-link font-body inline-flex min-h-11 w-fit items-center justify-center text-sm font-semibold text-horo-pulse transition-colors hover:text-horo-root focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-horo-pulse"
          >
            {sectionCta ?? copy.home.startHereViewAll}
            <span aria-hidden className="ms-1">
              →
            </span>
          </Link>
        </div>

        <div className="home-founding-grid">
          {featuredProducts.map((product, index) => {
            const reveal = (['stagger-1', 'stagger-2', 'stagger-3', 'stagger-4', 'stagger-5'] as const)[index % 5];
            return (
              <HomeFoundingProductCard
                key={product.slug}
                product={product}
                eager={index < 3}
                data-reveal={reveal}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
