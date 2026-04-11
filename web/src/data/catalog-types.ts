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

export type ProductSizeKey = 'S' | 'M' | 'L' | 'XL' | 'XXL';

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

export type ProductMediaRecord = {
  gallery?: string[];
  main?: string | null;
};

export type ProductVariantRecord = {
  id: string;
  size: ProductSizeKey;
  sku?: string | null;
  priceEgp: number;
  currencyCode?: string;
  manageInventory: boolean;
  allowBackorder: boolean;
  available: boolean;
  inventoryQuantity?: number | null;
};

export type Product = {
  apparelCategoryPath?: string;
  slug: string;
  name: string;
  artistSlug: string;
  primaryFeelingSlug?: string;
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
  occasionSlugs: OccasionSlug[];
  priceEgp: number;
  story: string;
  /** Card + quick view merchandising label, e.g. "Bestseller" */
  merchandisingBadge?: string;
  /** Shown as "FEELING / FIT" in quick view */
  fitLabel?: string;
  /** Optional scarcity line in quick view */
  stockNote?: string;
  /** Per-size FOMO / inventory hints on PDP, e.g. { M: "Only 2 left" } */
  inventoryHintBySize?: Partial<Record<ProductSizeKey, string>>;
  /** If set, restricts which sizes appear in stock (search filter + PDP). Omit = all non-disabled catalog sizes. */
  availableSizes?: ProductSizeKey[];
  /** Optional on-body copy for PDP (e.g. two models). When absent, PDP uses global template + fitLabel. */
  pdpFitModels?: readonly PdpFitModel[];
  /** Optional studio / design-intent quotes — not customer reviews (no review schema emitted). */
  wearerStories?: readonly WearerStory[];
  /** Merchandising: complementary product slugs for “Style it with”. */
  complementarySlugs?: string[];
  /** Merchandising: co-purchase suggestions (1–2 slugs) for “Frequently bought together”. */
  frequentlyBoughtWithSlugs?: string[];
  /** Merchandising: social-proof style picks (1–2 slugs) for “Customers also bought”. */
  customersAlsoBoughtSlugs?: string[];
  /** Garment/tee body colors for search filtering (display labels, e.g. "Black"). */
  garmentColors?: readonly string[];
  thumbnail?: string | null;
  media?: ProductMediaRecord;
  variantsBySize?: Partial<Record<ProductSizeKey, ProductVariantRecord>>;
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
