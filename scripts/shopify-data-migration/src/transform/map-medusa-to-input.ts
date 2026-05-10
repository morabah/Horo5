/**
 * Map Medusa storefront DTOs to migration pipeline input shapes.
 */

import type { ProductInput, ProductVariantInput } from './map-products.js';

interface MedusaVariantDTO {
  size: string;
  color?: string;
  price_egp: number;
  original_price_egp?: number | null;
  sku?: string | null;
  inventory_quantity?: number | null;
  available?: boolean;
}

interface MedusaMediaGalleryItem {
  url: string;
  tag?: string;
}

interface MedusaMediaDTO {
  gallery?: MedusaMediaGalleryItem[];
  main?: string | null;
}

interface MedusaProductDTO {
  name: string;
  slug: string;
  description?: string;
  priceEgp: number;
  originalPriceEgp?: number | null;
  variantsBySize?: Record<string, MedusaVariantDTO>;
  media?: MedusaMediaDTO;
  story?: string;
  storyDescription?: string;
  feelingSlug?: string;
  primarySubfeelingSlug?: string;
  occasionSlugs?: string[];
  artistSlug?: string;
  sizeTableKey?: string;
  complementarySlugs?: string[];
  garmentColors?: string[];
  merchandisingBadge?: string;
  fitLabel?: string;
  trustBadges?: string[];
  worksFor?: string[];
  useCase?: string;
  updatedAt?: string;
}

function mapMedusaVariants(product: MedusaProductDTO): ProductVariantInput[] | undefined {
  const variants = product.variantsBySize;
  if (!variants) return undefined;

  const mapped: ProductVariantInput[] = [];
  for (const [size, v] of Object.entries(variants)) {
    if (!v) continue;
    mapped.push({
      option1: v.size || size,
      option2: v.color,
      price: v.price_egp ?? product.priceEgp,
      compareAtPrice: v.original_price_egp ?? product.originalPriceEgp ?? undefined,
      sku: v.sku ?? undefined,
      inventoryQuantity: v.inventory_quantity ?? undefined,
    });
  }
  return mapped;
}

function extractImages(product: MedusaProductDTO): { urls: string[]; alts: string[] } {
  const urls: string[] = [];
  const alts: string[] = [];

  // Main image first
  if (product.media?.main) {
    urls.push(product.media.main);
    alts.push(`${product.name} — main`);
  }

  // Gallery images
  if (product.media?.gallery && Array.isArray(product.media.gallery)) {
    for (const item of product.media.gallery) {
      if (item.url && !urls.includes(item.url)) {
        urls.push(item.url);
        const tagPrefix = item.tag ? `proof:${item.tag.replace('proof_', '')} — ` : '';
        alts.push(`${tagPrefix}${product.name}`);
      }
    }
  }

  return { urls, alts };
}

function buildTags(product: MedusaProductDTO): string[] {
  const tags: string[] = [];
  if (product.feelingSlug) tags.push(`feeling:${product.feelingSlug}`);
  if (product.primarySubfeelingSlug) tags.push(`line:${product.primarySubfeelingSlug}`);
  if (product.occasionSlugs) {
    for (const o of product.occasionSlugs) tags.push(`occasion:${o}`);
  }
  if (product.garmentColors) {
    for (const c of product.garmentColors) tags.push(`color:${c}`);
  }
  if (product.merchandisingBadge) tags.push(`badge:${product.merchandisingBadge}`);
  if (product.fitLabel) tags.push(`fit:${product.fitLabel}`);
  return tags;
}

export function mapMedusaProductToInput(product: Record<string, unknown>): ProductInput {
  const p = product as unknown as MedusaProductDTO;
  const images = extractImages(p);
  const variants = mapMedusaVariants(p);

  return {
    title: p.name || 'Untitled Product',
    handle: p.slug || `product-${Date.now()}`,
    description: p.description,
    price: p.priceEgp ?? 0,
    compare_at_price: p.originalPriceEgp ?? undefined,
    vendor: 'HORO',
    product_type: 'T-Shirt',
    tags: buildTags(p),
    feeling: p.feelingSlug,
    subfeeling: p.primarySubfeelingSlug,
    occasions: p.occasionSlugs,
    artist: p.artistSlug,
    size_table: p.sizeTableKey,
    pair_with_products: p.complementarySlugs,
    images: images.urls,
    imageAlts: images.alts,
    variants,
    active: true,
  };
}

interface MedusaFeelingDTO {
  name: string;
  slug: string;
  blurb?: string;
  tagline?: string;
  accent?: string;
  heroImageSrc?: string;
  cardImageSrc?: string;
  manifesto?: string;
  sortOrder?: number;
  active?: boolean;
}

export function mapMedusaFeelingToInput(feeling: Record<string, unknown>) {
  const f = feeling as unknown as MedusaFeelingDTO;
  return {
    title: f.name,
    handle: f.slug,
    description: f.blurb,
    tagline: f.tagline,
    accent_color: f.accent,
    hero_image: f.heroImageSrc,
    card_image: f.cardImageSrc,
    manifesto: f.manifesto,
    sort_order: f.sortOrder ?? 0,
    active: f.active !== false,
  };
}

interface MedusaSubfeelingDTO {
  name: string;
  slug: string;
  blurb?: string;
  feelingSlug: string;
  heroImageSrc?: string;
  cardImageSrc?: string;
  sortOrder?: number;
  active?: boolean;
}

export function mapMedusaSubfeelingToInput(subfeeling: Record<string, unknown>) {
  const s = subfeeling as unknown as MedusaSubfeelingDTO;
  return {
    title: s.name,
    handle: s.slug,
    description: s.blurb,
    parent_feeling: s.feelingSlug,
    hero_image: s.heroImageSrc,
    card_image: s.cardImageSrc,
    sort_order: s.sortOrder ?? 0,
    active: s.active !== false,
  };
}

interface MedusaOccasionDTO {
  name: string;
  slug: string;
  blurb?: string;
  accent?: string;
  heroImageSrc?: string;
  cardImageSrc?: string;
  isGiftOccasion?: boolean;
  priceHint?: string;
  sortOrder?: number;
  active?: boolean;
}

export function mapMedusaOccasionToInput(occasion: Record<string, unknown>) {
  const o = occasion as unknown as MedusaOccasionDTO;
  return {
    title: o.name,
    handle: o.slug,
    description: o.blurb,
    accent_color: o.accent,
    hero_image: o.heroImageSrc,
    card_image: o.cardImageSrc,
    is_gift_occasion: o.isGiftOccasion ?? false,
    price_hint: o.priceHint,
    sort_order: o.sortOrder ?? 0,
    active: o.active !== false,
  };
}

interface MedusaArtistDTO {
  name: string;
  slug: string;
  style?: string;
  bio?: string;
  avatarSrc?: string;
  designCount?: number;
  active?: boolean;
}

export function mapMedusaArtistToInput(artist: Record<string, unknown>) {
  const a = artist as unknown as MedusaArtistDTO;
  return {
    name: a.name,
    slug: a.slug,
    style: a.style,
    bio: a.bio,
    avatar: a.avatarSrc,
    design_count: a.designCount ?? 0,
    active: a.active !== false,
  };
}
