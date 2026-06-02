import type { Product, ProductMediaGalleryTag, ProductSizeKey, ProductVariantRecord } from '@/storefront/data/catalog-types';

/** Medusa storefront product JSON (camelCase DTO from `/storefront/*`). */
export type StorefrontProductApi = {
  id?: string;
  apparelCategoryPath?: string;
  artistDisplay?: Product['artistDisplay'];
  artistSlug: string;
  artworkSlug?: string;
  availableSizes?: string[];
  buyerRoute?: Product['buyerRoute'];
  primaryAudience?: Product['primaryAudience'];
  firstWedgeEligible?: boolean;
  giftable?: boolean;
  giftOccasionTags?: string[];
  careInstructions?: string;
  capsuleSlugs?: string[];
  complementarySlugs?: string[];
  customersAlsoBoughtSlugs?: string[];
  decorationType?: Product['decorationType'];
  description?: string;
  feelingSlug: string;
  lineSlug?: string;
  launchGroup?: Product['launchGroup'];
  launchAudience?: Product['launchAudience'];
  launchDesign?: Product['launchDesign'];
  zodiacSign?: Product['zodiacSign'];
  fitLabel?: string;
  frequentlyBoughtWithSlugs?: string[];
  garmentColors?: string[];
  inventoryHintBySize?: Record<string, string>;
  stockStatusBySize?: Product['stockStatusBySize'];
  fitBySize?: Product['fitBySize'];
  launchAt?: string;
  sunsetAt?: string;
  /** ISO from Medusa product row */
  updatedAt?: string;
  media?: Product['media'];
  merchandisingBadge?: string;
  /** Campaign chip; backend omits when not live. */
  promoLabel?: Product['promoLabel'];
  /** ISO-8601 promo start for admin previews / scheduled promos. */
  promoStartsAt?: string;
  /** ISO-8601 promo deadline for countdown. */
  promoEndsAt?: string;
  /** Defaults to true. False hides countdown chips. */
  promoShowCountdown?: boolean;
  name: string;
  pdpTagLabels?: string[];
  occasionSlugs: string[];
  originalPriceEgp?: number | null;
  pdpFitModels?: Product['pdpFitModels'];
  sizeTableKey?: string;
  physicalAttributes?: Product['physicalAttributes'];
  defaultPriceSize?: string;
  feelingBrowseEligible?: boolean;
  feelingBrowseAssignments?: Product['feelingBrowseAssignments'];
  primaryFeelingSlug: string;
  primaryOccasionSlug?: string;
  primarySubfeelingSlug: string;
  priceEgp: number;
  slug: string;
  stockNote?: string;
  story: string;
  thumbnail?: string | null;
  hasValidPrimaryImage?: boolean;
  trustBadges?: string[];
  reviewsSummary?: Product['reviewsSummary'];
  reviewProof?: Product['reviewProof'];
  useCase?: string;
  variantsBySize?: StorefrontVariantApi;
  variantsByColor?: Record<string, StorefrontVariantApi[keyof StorefrontVariantApi][]>;
  wearerStories?: Product['wearerStories'];
};

type StorefrontVariantApi = Record<
  string,
  {
    id: string;
    allow_backorder: boolean;
    available: boolean;
    currency_code: string;
    inventory_quantity: number | null;
    is_discounted: boolean;
    manage_inventory: boolean;
    original_price_egp: number | null;
    price_egp: number;
    size: string;
    sku?: string | null;
    color?: string;
    media?: Product['media'];
  }
>;

function normalizeOneVariant(variant: StorefrontVariantApi[keyof StorefrontVariantApi], sizeKey: string): ProductVariantRecord {
  return {
    id: variant.id,
    size: sizeKey as ProductSizeKey,
    sku: variant.sku ?? null,
    originalPriceEgp: variant.original_price_egp,
    priceEgp: variant.price_egp,
    currencyCode: variant.currency_code,
    isDiscounted: variant.is_discounted,
    manageInventory: variant.manage_inventory,
    allowBackorder: variant.allow_backorder,
    available: variant.available,
    inventoryQuantity: variant.inventory_quantity,
    ...(variant.color ? { color: variant.color } : {}),
    ...(variant.media ? { media: variant.media } : {}),
  };
}

function normalizeVariantMap(variants: StorefrontVariantApi | undefined): Product['variantsBySize'] {
  if (!variants) return undefined;

  return Object.fromEntries(
    Object.entries(variants).map(([size, variant]) => [size, normalizeOneVariant(variant, size)]),
  );
}

const VALID_GALLERY_TAGS: ProductMediaGalleryTag[] = [
  'proof_fabric',
  'proof_print',
  'proof_wash',
  'lifestyle',
  'flat_lay',
  'artwork_detail',
  'back',
  'gift',
];

export function normalizeMedia(media: Product['media'] | undefined): Product['media'] {
  if (!media) return undefined;
  const gallery = (media.gallery ?? []).map((item) => {
    if (typeof item === 'string') return item;
    const tag = item.tag && VALID_GALLERY_TAGS.includes(item.tag as ProductMediaGalleryTag)
      ? (item.tag as ProductMediaGalleryTag)
      : undefined;
    return { url: item.url, ...(tag ? { tag } : {}) };
  });
  return {
    ...media,
    gallery: gallery.length > 0 ? gallery : undefined,
  };
}

function normalizeVariantsByColor(raw: StorefrontProductApi['variantsByColor']): Product['variantsByColor'] {
  if (!raw) return undefined;
  const out: Record<string, ProductVariantRecord[]> = {};
  for (const [color, rows] of Object.entries(raw)) {
    if (!rows?.length) continue;
    out[color] = rows.map((variant) => normalizeOneVariant(variant, String(variant.size)));
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/** Normalize Medusa storefront product JSON to storefront `Product` (browser + RSC). */
export function normalizeStorefrontProductApi(product: StorefrontProductApi): Product {
  return {
    id: product.id,
    apparelCategoryPath: product.apparelCategoryPath,
    artistDisplay: product.artistDisplay,
    artistSlug: product.artistSlug,
    artworkSlug: product.artworkSlug,
    availableSizes: product.availableSizes as Product['availableSizes'],
    buyerRoute: product.buyerRoute,
    primaryAudience: product.primaryAudience,
    firstWedgeEligible: product.firstWedgeEligible,
    giftable: product.giftable,
    giftOccasionTags: product.giftOccasionTags,
    careInstructions: product.careInstructions,
    capsuleSlugs: product.capsuleSlugs,
    complementarySlugs: product.complementarySlugs,
    customersAlsoBoughtSlugs: product.customersAlsoBoughtSlugs,
    decorationType: product.decorationType,
    description: product.description,
    feelingSlug: product.feelingSlug,
    lineSlug: product.lineSlug,
    launchGroup: product.launchGroup,
    launchAudience: product.launchAudience,
    launchDesign: product.launchDesign,
    zodiacSign: product.zodiacSign,
    fitLabel: product.fitLabel,
    frequentlyBoughtWithSlugs: product.frequentlyBoughtWithSlugs,
    garmentColors: product.garmentColors,
    inventoryHintBySize: product.inventoryHintBySize as Product['inventoryHintBySize'],
    stockStatusBySize: product.stockStatusBySize,
    fitBySize: product.fitBySize,
    launchAt: product.launchAt,
    sunsetAt: product.sunsetAt,
    updatedAt: product.updatedAt,
    media: normalizeMedia(product.media),
    merchandisingBadge: product.merchandisingBadge,
    promoLabel: product.promoLabel,
    promoStartsAt: product.promoStartsAt,
    promoEndsAt: product.promoEndsAt,
    promoShowCountdown: product.promoShowCountdown,
    name: product.name,
    pdpTagLabels: product.pdpTagLabels,
    occasionSlugs: product.occasionSlugs,
    originalPriceEgp: product.originalPriceEgp,
    pdpFitModels: product.pdpFitModels,
    sizeTableKey: product.sizeTableKey,
    physicalAttributes: product.physicalAttributes,
    defaultPriceSize: product.defaultPriceSize as Product['defaultPriceSize'],
    feelingBrowseEligible: product.feelingBrowseEligible ?? true,
    feelingBrowseAssignments: product.feelingBrowseAssignments,
    primaryFeelingSlug: product.primaryFeelingSlug,
    primaryOccasionSlug: product.primaryOccasionSlug,
    primarySubfeelingSlug: product.primarySubfeelingSlug,
    priceEgp: product.priceEgp,
    slug: product.slug,
    stockNote: product.stockNote,
    story: product.story,
    thumbnail: product.thumbnail,
    hasValidPrimaryImage: product.hasValidPrimaryImage,
    trustBadges: product.trustBadges,
    reviewsSummary: product.reviewsSummary,
    reviewProof: product.reviewProof,
    useCase: product.useCase,
    variantsBySize: normalizeVariantMap(product.variantsBySize),
    variantsByColor: normalizeVariantsByColor(product.variantsByColor),
    wearerStories: product.wearerStories,
  };
}
