import type { StorefrontHomepageSection } from '../data/catalog-types';
import { getProductComparisonImageSrc } from '../data/images';
import {
  getProducts,
  productHasRealImage,
  type Product,
} from '../data/site';

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

export function payloadLimit(section: StorefrontHomepageSection | undefined) {
  const payload = isRecord(section?.payload) ? section.payload : null;
  const raw = payload?.limit ?? payload?.productLimit;
  const parsed = typeof raw === 'number' || typeof raw === 'string' ? Number(raw) : NaN;
  const isFounding =
    section?.type === 'founding_drop' || section?.key === 'founding_drop';
  const defaultLimit = isFounding ? 5 : 11;
  const maxLimit = isFounding ? 5 : 12;
  return Number.isFinite(parsed) && parsed > 0
    ? Math.min(Math.trunc(parsed), maxLimit)
    : defaultLimit;
}

export function resolveHomeProducts(inputProducts: Product[] | undefined, section: StorefrontHomepageSection | undefined) {
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

  return selected
    .filter((product) => (product.priceEgp ?? 0) > 0)
    .slice(0, payloadLimit(section));
}
