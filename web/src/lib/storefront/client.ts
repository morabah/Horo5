import type {
  Artist,
  Feeling,
  FeelingBrowseAssignment,
  MerchEvent,
  Occasion,
  Product,
  ProductSizeKey,
  RuntimeCatalog,
  Subfeeling,
} from "../../data/catalog-types";

const baseUrl = (import.meta.env.VITE_MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/+$/, "");
const publishableApiKey = import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY || "";
const missingPublishableKeyMessage =
  "Missing Medusa publishable key. Set NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY in web-next/.env.local (or VITE_MEDUSA_PUBLISHABLE_KEY for the Vite app) and restart the frontend.";

type StorefrontVariantResponse = {
  allow_backorder: boolean;
  available: boolean;
  currency_code: string;
  id: string;
  inventory_quantity: number | null;
  is_discounted: boolean;
  manage_inventory: boolean;
  original_price_egp: number | null;
  price_egp: number;
  size: string;
  sku?: string | null;
};

type StorefrontProductResponse = {
  apparelCategoryPath?: string;
  artistDisplay?: Product["artistDisplay"];
  artistSlug: string;
  artworkSlug?: string;
  availableSizes?: string[];
  capsuleSlugs?: string[];
  complementarySlugs?: string[];
  customersAlsoBoughtSlugs?: string[];
  decorationType?: Product["decorationType"];
  description?: string;
  feelingSlug: string;
  lineSlug?: string;
  fitLabel?: string;
  frequentlyBoughtWithSlugs?: string[];
  garmentColors?: string[];
  inventoryHintBySize?: Record<string, string>;
  media?: Product["media"];
  merchandisingBadge?: string;
  name: string;
  occasionSlugs: string[];
  originalPriceEgp?: number | null;
  pdpFitModels?: Product["pdpFitModels"];
  physicalAttributes?: Product["physicalAttributes"];
  defaultPriceSize?: string;
  feelingBrowseEligible?: boolean;
  feelingBrowseAssignments?: FeelingBrowseAssignment[];
  primaryFeelingSlug: string;
  primaryOccasionSlug?: string;
  primarySubfeelingSlug: string;
  priceEgp: number;
  slug: string;
  stockNote?: string;
  story: string;
  thumbnail?: string | null;
  trustBadges?: string[];
  useCase?: string;
  variantsBySize?: Record<string, StorefrontVariantResponse>;
  wearerStories?: Product["wearerStories"];
};

type StorefrontArtistResponse = Artist;
type StorefrontFeelingResponse = Feeling;
type StorefrontSubfeelingResponse = Subfeeling;
type StorefrontOccasionResponse = Occasion & {
  active?: boolean;
  productHandles?: string[];
  seoDescription?: string;
  seoTitle?: string;
  sortOrder?: number;
};

type StorefrontMerchEventResponse = MerchEvent;

type StorefrontCatalogResponse = {
  artists?: StorefrontArtistResponse[];
  events?: StorefrontMerchEventResponse[];
  feelings?: StorefrontFeelingResponse[];
  occasions?: StorefrontOccasionResponse[];
  products?: StorefrontProductResponse[];
  subfeelings?: StorefrontSubfeelingResponse[];
};

async function request<T>(path: string): Promise<T> {
  if (!publishableApiKey) {
    throw new Error(missingPublishableKeyMessage);
  }

  const headers = new Headers();

  if (publishableApiKey) {
    headers.set("x-publishable-api-key", publishableApiKey);
  }

  const response = await fetch(`${baseUrl}${path}`, {
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Storefront request failed (${response.status}): ${text}`);
  }

  return (await response.json()) as T;
}

function normalizeVariantMap(
  variants: StorefrontProductResponse["variantsBySize"]
): Product["variantsBySize"] {
  if (!variants) return undefined;

  return Object.fromEntries(
    Object.entries(variants).map(([size, variant]) => [
      size,
      {
        id: variant.id,
        size: size as ProductSizeKey,
        sku: variant.sku ?? null,
        originalPriceEgp: variant.original_price_egp,
        priceEgp: variant.price_egp,
        currencyCode: variant.currency_code,
        isDiscounted: variant.is_discounted,
        manageInventory: variant.manage_inventory,
        allowBackorder: variant.allow_backorder,
        available: variant.available,
        inventoryQuantity: variant.inventory_quantity,
      },
    ])
  );
}

function normalizeProduct(product: StorefrontProductResponse): Product {
  return {
    apparelCategoryPath: product.apparelCategoryPath,
    artistDisplay: product.artistDisplay,
    artistSlug: product.artistSlug,
    artworkSlug: product.artworkSlug,
    availableSizes: product.availableSizes as Product["availableSizes"],
    capsuleSlugs: product.capsuleSlugs,
    complementarySlugs: product.complementarySlugs,
    customersAlsoBoughtSlugs: product.customersAlsoBoughtSlugs,
    decorationType: product.decorationType,
    description: product.description,
    feelingSlug: product.feelingSlug,
    lineSlug: product.lineSlug,
    fitLabel: product.fitLabel,
    frequentlyBoughtWithSlugs: product.frequentlyBoughtWithSlugs,
    garmentColors: product.garmentColors,
    inventoryHintBySize: product.inventoryHintBySize as Product["inventoryHintBySize"],
    media: product.media,
    merchandisingBadge: product.merchandisingBadge,
    name: product.name,
    occasionSlugs: product.occasionSlugs,
    originalPriceEgp: product.originalPriceEgp,
    pdpFitModels: product.pdpFitModels,
    physicalAttributes: product.physicalAttributes,
    defaultPriceSize: product.defaultPriceSize as Product["defaultPriceSize"],
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
    trustBadges: product.trustBadges,
    useCase: product.useCase,
    variantsBySize: normalizeVariantMap(product.variantsBySize),
    wearerStories: product.wearerStories,
  };
}

function normalizeOccasion(occasion: StorefrontOccasionResponse): Occasion {
  return {
    accent: occasion.accent,
    active: occasion.active,
    blurb: occasion.blurb,
    cardImageAlt: occasion.cardImageAlt,
    cardImageSrc: occasion.cardImageSrc,
    heroImageAlt: occasion.heroImageAlt,
    heroImageSrc: occasion.heroImageSrc,
    isGiftOccasion: occasion.isGiftOccasion,
    name: occasion.name,
    priceHint: occasion.priceHint,
    seoDescription: occasion.seoDescription,
    seoTitle: occasion.seoTitle,
    slug: occasion.slug,
    sortOrder: occasion.sortOrder,
  };
}

export async function fetchStorefrontCatalog(): Promise<RuntimeCatalog> {
  const data = await request<StorefrontCatalogResponse>("/storefront/catalog");

  return {
    artists: (data.artists || []) as Artist[],
    events: (data.events || []) as MerchEvent[],
    feelings: (data.feelings || []) as Feeling[],
    occasions: (data.occasions || []).map(normalizeOccasion),
    products: (data.products || []).map(normalizeProduct),
    subfeelings: (data.subfeelings || []) as Subfeeling[],
  };
}

export async function fetchStorefrontProduct(slug: string): Promise<Product | null> {
  const data = await request<{ product?: StorefrontProductResponse }>(`/storefront/products/${encodeURIComponent(slug)}`);
  return data.product ? normalizeProduct(data.product) : null;
}
