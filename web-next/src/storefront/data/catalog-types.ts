/** Mock catalog — wireframe-aligned placeholders */

export type Feeling = {
  active?: boolean;
  accent: string;
  blurb: string;
  cardImageAlt?: string;
  cardImageSrc?: string;
  heroImageAlt?: string;
  heroImageSrc?: string;
  manifesto?: string;
  name: string;
  seoDescription?: string;
  seoTitle?: string;
  slug: string;
  sortOrder?: number;
  tagline: string;
};

export type Subfeeling = {
  active?: boolean;
  blurb: string;
  cardImageAlt?: string;
  cardImageSrc?: string;
  feelingSlug: string;
  heroImageAlt?: string;
  heroImageSrc?: string;
  name: string;
  seoDescription?: string;
  seoTitle?: string;
  slug: string;
  sortOrder?: number;
};
export type Occasion = {
  accent?: string;
  active?: boolean;
  blurb: string;
  cardImageAlt: string;
  cardImageSrc: string;
  heroImageAlt: string;
  heroImageSrc: string;
  isGiftOccasion: boolean;
  name: string;
  priceHint?: string;
  seoDescription?: string;
  seoTitle?: string;
  slug: string;
  sortOrder?: number;
};

export type OccasionSlug = string;

export type Artist = {
  active?: boolean;
  avatarSrc?: string;
  designCount: number;
  name: string;
  slug: string;
  style: string;
};

export type ProductSizeKey = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';

export type PdpFitModel = {
  heightCm: number;
  heightImperial: string;
  sizeWorn: string;
  fitNote?: string;
};

export type WearerStory = {
  quote: string;
  author: string;
  rating?: 1 | 2 | 3 | 4 | 5;
};

export type ReviewProof = {
  id: string;
  rating: number;
  body: string;
  locale: string;
  photoUrl?: string | null;
  videoUrl?: string | null;
  instagramHandle?: string | null;
  permissionToRepost: boolean;
  fitFeedback?: string | null;
  giftFeedback?: string | null;
  ugcType: 'review' | 'photo' | 'video' | 'delivery_reaction';
  source: 'post_delivery_whatsapp' | 'website' | 'manual_admin' | 'instagram';
  createdAt?: string | null;
};

export type ReviewsSummary = {
  count: number;
  averageRating: number;
};

export type ProductMediaGalleryTag =
  | 'proof_fabric'
  | 'proof_print'
  | 'proof_wash'
  | 'lifestyle'
  | 'flat_lay';

export type ProductMediaGalleryItem = {
  url: string;
  tag?: ProductMediaGalleryTag;
};

export function productMediaGalleryItemSrc(
  item: ProductMediaGalleryItem | string | null | undefined,
): string | undefined {
  if (typeof item === 'string') return item.trim() || undefined;
  const url = item?.url?.trim();
  return url || undefined;
}

export type LocalizedStorefrontText = string | { en?: string; ar?: string } | null;

export type StorefrontHomepageSection = {
  id: string;
  key: string;
  type:
    | 'hero'
    | 'trust_ribbon'
    | 'primary_routes'
    | 'founding_drop'
    | 'featured_piece'
    | 'feeling_grid'
    | 'occasion_grid'
    | 'gift_block'
    | 'why_horo'
    | 'first_drop_circle'
    | 'proof_strip'
    | 'seen_on_you'
    | 'artist_spotlight';
  eyebrow: LocalizedStorefrontText;
  title: LocalizedStorefrontText;
  body: LocalizedStorefrontText;
  primaryCta: { label: LocalizedStorefrontText; href: string | null } | null;
  secondaryCta: { label: LocalizedStorefrontText; href: string | null } | null;
  image: { src: string; alt: LocalizedStorefrontText } | null;
  accent: string | null;
  sortOrder: number;
  active: boolean;
  payload: Record<string, unknown> | null;
};

export function pickLocalizedStorefrontText(
  value: LocalizedStorefrontText | undefined,
  locale: 'en' | 'ar',
): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || undefined;
  }
  const localized = value[locale]?.trim() || value.en?.trim() || value.ar?.trim();
  return localized || undefined;
}

export type ProductMediaRecord = {
  /** Optional curated crop for product cards / PLPs. */
  card?: string | null;
  gallery?: Array<ProductMediaGalleryItem | string>;
  main?: string | null;
  blurDataUrlMain?: string | null;
  dominantColorMain?: string | null;
};

/** Medusa product / default-variant shipping attributes (Admin “Attributes”), when present on the storefront DTO. */
export type ProductPhysicalAttributes = {
  weight?: string;
  length?: string;
  height?: string;
  width?: string;
  originCountry?: string;
  hsCode?: string;
  midCode?: string;
  material?: string;
};

/** PDP artist from Medusa `metadata.artist`; storefront may also resolve from artistSlug + catalog artists. */
export type ProductArtistDisplay = {
  name: string;
  avatarUrl?: string;
};

export type ProductBuyerRoute =
  | 'feeling'
  | 'moment'
  | 'gift'
  | 'personality'
  | 'artist_drop'
  | 'world';

export type ProductPrimaryAudience =
  | '25-40'
  | '18-24'
  | 'gift-buyer'
  | 'artist-aware'
  | '40-plus';

export type StockStatusKey = 'in_stock' | 'low_stock' | 'sold_out' | 'preorder';

export type ProductVariantRecord = {
  id: string;
  size: ProductSizeKey;
  sku?: string | null;
  originalPriceEgp?: number | null;
  priceEgp: number;
  currencyCode?: string;
  isDiscounted?: boolean;
  manageInventory: boolean;
  allowBackorder: boolean;
  available: boolean;
  inventoryQuantity?: number | null;
  color?: string;
  media?: ProductMediaRecord;
};

/** Pillar + optional line from Medusa product categories under `feelings` (normalized). */
export type FeelingBrowseAssignment = {
  feelingSlug: string;
  /** Empty when the product is linked only to the pillar category (no leaf). */
  subfeelingSlug: string;
};

export type Product = {
  id?: string;
  apparelCategoryPath?: string;
  slug: string;
  name: string;
  /** Prefer for PDP when set (from `metadata.artist`). */
  artistDisplay?: ProductArtistDisplay;
  artistSlug: string;
  buyerRoute?: ProductBuyerRoute;
  primaryAudience?: ProductPrimaryAudience;
  firstWedgeEligible?: boolean;
  giftable?: boolean;
  giftOccasionTags?: string[];
  careInstructions?: string;
  primaryFeelingSlug?: string;
  /** From Medusa catalog: false = omit from /feelings browse when category taxonomy is incomplete (strict mode). */
  feelingBrowseEligible?: boolean;
  /** All feeling/line placements from Medusa when the product spans multiple branches. */
  feelingBrowseAssignments?: FeelingBrowseAssignment[];
  primarySubfeelingSlug?: string;
  primaryOccasionSlug?: string;
  feelingSlug: string;
  /** Thematic line: emotions, zodiac, fiction, career, trends (from Medusa metadata / handle). */
  lineSlug?: string;
  decorationType?: 'plain' | 'graphic' | 'embroidered' | 'mixed';
  artworkSlug?: string;
  description?: string;
  /** Short merchandising cue for featured/home cards */
  useCase?: string;
  /** Recurring capsules (e.g. zodiac) — not top-level browse pillars §6.4 */
  capsuleSlugs?: string[];
  /**
   * PDP chips from Medusa: linked product category names only (see medusa-backend `buildPdpTagLabels`).
   * When set on a Medusa-backed PDP, these replace fixture `occasionSlugs` chips for that row.
   */
  pdpTagLabels?: string[];
  occasionSlugs: OccasionSlug[];
  defaultPriceSize?: ProductSizeKey;
  originalPriceEgp?: number | null;
  priceEgp: number;
  story: string;
  /** Longer background for PDP 'Design Story' accordion. */
  storyDescription?: string;
  /** Card + quick view merchandising label, e.g. "Bestseller" */
  merchandisingBadge?: string;
  /** Time-boxed campaign chip from Medusa `metadata.promoLabel` / `promo_ends_at`. */
  promoLabel?: Exclude<LocalizedStorefrontText, null>;
  /** ISO datetime when the promo becomes visible. */
  promoStartsAt?: string;
  /** ISO-8601 deadline for the active promo; used to render a live countdown on cards. */
  promoEndsAt?: string;
  /** Defaults to true. False hides countdown chips while keeping label and strike-through price. */
  promoShowCountdown?: boolean;
  /** Emotion/mood cues from Medusa metadata.feelsLike — e.g. ["quiet confidence"]. */
  feelsLike?: string[];
  /** Shown as "FEELING / FIT" in quick view */
  fitLabel?: string;
  /** Named preset under `store.metadata.sizeTables` (e.g. `oversized`). Editable as a string in Medusa Admin metadata. */
  sizeTableKey?: string;
  /** Optional scarcity line in quick view */
  stockNote?: string;
  /** Per-size FOMO / inventory hints on PDP, e.g. { M: "Only 2 left" } */
  inventoryHintBySize?: Partial<Record<ProductSizeKey, string>>;
  /** Derived from live inventory when Medusa reports levels (preferred over static hints). */
  stockStatusBySize?: Partial<Record<ProductSizeKey, StockStatusKey>>;
  /** Structured measurements from `product.metadata.fitBySize` (cm). */
  fitBySize?: Partial<
    Record<
      ProductSizeKey,
      {
        bust_cm?: number;
        length_cm?: number;
        sleeve_cm?: number;
        rise_cm?: number;
        inseam_cm?: number;
      }
    >
  >;
  /** ISO datetime — hide from catalog until this instant when set. */
  launchAt?: string;
  /** ISO datetime — hide from catalog after this instant when set. */
  sunsetAt?: string;
  /** Medusa `created_at` for launch recency logic. */
  createdAt?: string;
  /** Medusa `updated_at` for sitemap freshness. */
  updatedAt?: string;
  /** If set, restricts which sizes appear in stock (search filter + PDP). Omit = all non-disabled catalog sizes. */
  availableSizes?: ProductSizeKey[];
  /** Optional on-body copy for PDP (e.g. two models). When absent, PDP uses global template + fitLabel. */
  pdpFitModels?: readonly PdpFitModel[];
  /** Native Medusa weight/dimensions/etc. when `metadata.pdpFitModels` is not used. */
  physicalAttributes?: ProductPhysicalAttributes;
  /** Optional studio / design-intent quotes — not customer reviews (no review schema emitted). */
  wearerStories?: readonly WearerStory[];
  /** Reveal mode artist studio slides from Medusa metadata.artist_story_slides */
  artistStorySlides?: { src: string; labelEn: string; labelAr: string; descriptionEn: string; descriptionAr: string }[];
  /** Runtime-configurable trust/service bullets surfaced on PDP and merchandising entry points. */
  trustBadges?: readonly string[];
  /** Approved real customer reviews only. Empty/undefined means show no review placeholder. */
  reviewsSummary?: ReviewsSummary;
  /** Approved UGC/review media only; permissionToRepost controls public media display. */
  reviewProof?: readonly ReviewProof[];
  /** Merchandising: complementary product slugs for “Style it with”. */
  complementarySlugs?: string[];
  /** Merchandising: co-purchase suggestions (1–2 slugs) for “Frequently bought together”. */
  frequentlyBoughtWithSlugs?: string[];
  /** Merchandising: social-proof style picks (1–2 slugs) for “Customers also bought”. */
  customersAlsoBoughtSlugs?: string[];
  /** Garment/tee body colors for search filtering (display labels, e.g. "Black"). */
  garmentColors?: readonly string[];
  /** Occasion/moment cues from Medusa metadata.worksFor — e.g. ["night out", "gift"]. */
  worksFor?: string[];
  thumbnail?: string | null;
  /** True when the product has a non-null primary image. Used to gate catalog during launch readiness. */
  hasValidPrimaryImage?: boolean;
  media?: ProductMediaRecord;
  variantsBySize?: Partial<Record<ProductSizeKey, ProductVariantRecord>>;
  /**
   * Multi-color PDP: per-color variant rows (same shape as `variantsBySize` values).
   * When set, every variant should include `color`; `variantsBySize` reflects the default color row.
   */
  variantsByColor?: Record<string, ProductVariantRecord[]>;
};

/** @deprecated Use Subfeeling */
export type FeelingLine = Subfeeling;

export type MerchEvent = {
  slug: string;
  name: string;
  type: string;
  teaser: string;
  body: string;
  status: string;
  startsAt?: string;
  endsAt?: string;
  heroImageSrc?: string;
  heroImageAlt?: string;
  cardImageSrc?: string;
  cardImageAlt?: string;
  seoTitle?: string;
  seoDescription?: string;
  sortOrder: number;
  active: boolean;
  productHandles: string[];
  occasionSlug?: string;
};

export type RuntimeCatalog = {
  artists: Artist[];
  feelings: Feeling[];
  products: Product[];
  occasions: Occasion[];
  events: MerchEvent[];
  subfeelings: Subfeeling[];
};
