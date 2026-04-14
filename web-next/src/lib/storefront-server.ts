import { cache } from "react";
import type { Metadata } from "next";

import {
  type Artist,
  getFeeling,
  getOccasion,
  type Feeling,
  type MerchEvent,
  type Occasion,
  type Product,
  type ProductSizeKey,
  type RuntimeCatalog,
  type Subfeeling,
} from "@/storefront/data/site";
import { buildProductJsonLdSchema } from "@/storefront/seo/product-jsonld-schema";

function feelingFromCatalog(slug: string, catalog: Pick<RuntimeCatalog, "feelings"> | null | undefined): Feeling | undefined {
  if (catalog?.feelings?.length) {
    return catalog.feelings.find((f) => f.slug === slug);
  }
  return getFeeling(slug);
}

function occasionNameFromCatalog(
  slug: string,
  catalog: Pick<RuntimeCatalog, "occasions"> | null | undefined
): string | undefined {
  if (catalog?.occasions?.length) {
    return catalog.occasions.find((o) => o.slug === slug)?.name;
  }
  return getOccasion(slug)?.name;
}

type NextFetchOptions = RequestInit & {
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
};

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
  pdpTagLabels?: string[];
  occasionSlugs: string[];
  originalPriceEgp?: number | null;
  pdpFitModels?: Product["pdpFitModels"];
  physicalAttributes?: Product["physicalAttributes"];
  defaultPriceSize?: string;
  feelingBrowseEligible?: boolean;
  feelingBrowseAssignments?: Product["feelingBrowseAssignments"];
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
  accent?: string;
  active?: boolean;
  productHandles?: string[];
  seoDescription?: string;
  seoTitle?: string;
  sortOrder?: number;
};

type StorefrontCatalogResponse = {
  artists?: StorefrontArtistResponse[];
  events?: MerchEvent[];
  feelings?: StorefrontFeelingResponse[];
  occasions?: StorefrontOccasionResponse[];
  products?: StorefrontProductResponse[];
  subfeelings?: StorefrontSubfeelingResponse[];
};

const baseUrl = (
  process.env.MEDUSA_BACKEND_URL ||
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
  "http://localhost:9000"
).replace(/\/+$/, "");
const publishableApiKey =
  process.env.MEDUSA_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ||
  "";
const missingPublishableKeyMessage =
  "Missing Medusa publishable key. Set MEDUSA_PUBLISHABLE_KEY or NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY in web-next/.env.local and restart Next.";
const siteOrigin = (process.env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/+$/, "");
function catalogFetchOptions(extraTags: string[] = []): NextFetchOptions {
  return {
    next: {
      revalidate: 60,
      tags: ["catalog", "storefront", ...extraTags],
    },
  };
}

const CATALOG_FETCH_OPTIONS: NextFetchOptions = catalogFetchOptions();

async function storefrontRequest<T>(path: string, init: NextFetchOptions = {}): Promise<T> {
  if (!publishableApiKey) {
    throw new Error(missingPublishableKeyMessage);
  }

  const headers = new Headers(init.headers || {});

  if (publishableApiKey) {
    headers.set("x-publishable-api-key", publishableApiKey);
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Storefront request failed (${response.status}): ${text}`);
  }

  return (await response.json()) as T;
}

export function getStorefrontServerBaseUrl() {
  return baseUrl;
}

function isExpectedDynamicServerUsage(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const digest = "digest" in error ? error.digest : undefined;
  const description = "description" in error ? error.description : undefined;
  return (
    digest === "DYNAMIC_SERVER_USAGE" ||
    (typeof description === "string" && description.includes("Dynamic server usage"))
  );
}

export function logStorefrontFetchError(
  message: string,
  error: unknown,
  extra: Record<string, unknown> = {}
) {
  if (isExpectedDynamicServerUsage(error)) {
    return;
  }

  console.error(message, {
    baseUrl,
    ...extra,
    error,
  });
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
    pdpTagLabels: product.pdpTagLabels,
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

function toAbsoluteUrl(src: string | null | undefined): string | undefined {
  if (!src) return undefined;
  if (/^https?:\/\//i.test(src)) return src;
  if (!siteOrigin) return src;
  return src.startsWith("/") ? `${siteOrigin}${src}` : `${siteOrigin}/${src}`;
}

async function fetchStorefrontCatalogServerImpl(): Promise<RuntimeCatalog> {
  const data = await storefrontRequest<StorefrontCatalogResponse>("/storefront/catalog", CATALOG_FETCH_OPTIONS);

  return {
    artists: (data.artists || []) as Artist[],
    events: (data.events || []) as MerchEvent[],
    feelings: (data.feelings || []) as Feeling[],
    occasions: (data.occasions || []).map(normalizeOccasion),
    products: (data.products || []).map(normalizeProduct),
    subfeelings: (data.subfeelings || []) as Subfeeling[],
  };
}

/** Dedupe catalog fetches across layout + pages in one request. */
export const fetchStorefrontCatalogServer = cache(fetchStorefrontCatalogServerImpl);

async function fetchStorefrontProductServerImpl(
  slug: string,
  init: NextFetchOptions = {}
): Promise<Product | null> {
  try {
    const data = await storefrontRequest<{ product?: StorefrontProductResponse }>(
      `/storefront/products/${encodeURIComponent(slug)}`,
      init
    );
    return data.product ? normalizeProduct(data.product) : null;
  } catch (error) {
    if (error instanceof Error && error.message.includes("(404)")) {
      return null;
    }

    throw error;
  }
}

/** Per-request dedupe for metadata + page. Source of truth: Medusa storefront API only. */
export const fetchStorefrontProductServer = cache((slug: string) =>
  fetchStorefrontProductServerImpl(slug, {
    next: {
      revalidate: 60,
      tags: ["catalog", "storefront", "product", `product:${encodeURIComponent(slug)}`],
    },
  })
);

async function fetchStorefrontOccasionServerImpl(
  slug: string,
  init: NextFetchOptions = {}
): Promise<Occasion | null> {
  try {
    const data = await storefrontRequest<{ occasion?: StorefrontOccasionResponse }>(
      `/storefront/occasions/${encodeURIComponent(slug)}`,
      init
    );
    return data.occasion ? normalizeOccasion(data.occasion) : null;
  } catch (error) {
    if (error instanceof Error && error.message.includes("(404)")) {
      return null;
    }

    throw error;
  }
}

/** Per-request dedupe for metadata + page (same slug). */
export const fetchStorefrontOccasionServer = cache((slug: string) =>
  fetchStorefrontOccasionServerImpl(slug, {
    next: { revalidate: 60, tags: ["catalog", "taxonomy", "taxonomy:occasions", `taxonomy:occasion:${slug}`] },
  })
);

type StorefrontSettingsResponse = {
  delivery?: unknown | null;
};

async function fetchStorefrontSettingsServerImpl(): Promise<unknown | null> {
  try {
    const data = await storefrontRequest<StorefrontSettingsResponse>("/storefront/settings", {
      /** Always bypass Next Data Cache — operators expect Medusa edits to show without a long TTL wait. */
      cache: "no-store",
      next: {
        tags: ["storefront", "settings"],
      },
    });
    return data.delivery ?? null;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[storefront] GET /storefront/settings failed — PDP delivery falls back to defaults.",
        error instanceof Error ? error.message : error,
      );
    }
    return null;
  }
}

/** Global storefront settings from Medusa (e.g. `store.metadata.delivery`). Not cached in Next; use Medusa `store.updated` + revalidate tag `settings` for freshness after edits. */
export const fetchStorefrontSettingsServer = cache(fetchStorefrontSettingsServerImpl);

export function buildOccasionMetadata(occasion: Occasion): Metadata {
  const title = `${occasion.name} | HORO Egypt`;
  const description =
    occasion.blurb ||
    `Shop ${occasion.name} graphic tees from HORO Egypt — gift-ready streetwear with COD and 14-day exchange.`;
  const canonical = siteOrigin ? `${siteOrigin}/occasions/${occasion.slug}` : `/occasions/${occasion.slug}`;
  const image = toAbsoluteUrl(occasion.heroImageSrc);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      images: image ? [{ url: image, alt: occasion.heroImageAlt }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export function buildProductMetadata(
  product: Product,
  catalog?: Pick<RuntimeCatalog, "feelings"> | null
): Metadata {
  const feelingSlug = product.primaryFeelingSlug ?? product.feelingSlug;
  const feeling = feelingFromCatalog(feelingSlug, catalog);
  const description =
    product.description ||
    `${product.name} graphic tee from HORO Egypt${feeling ? `, aligned with ${feeling.name}` : ""}. ${product.priceEgp} EGP with COD and 14-day exchange in Egypt.`;
  const canonical = siteOrigin ? `${siteOrigin}/products/${product.slug}` : `/products/${product.slug}`;
  const image = toAbsoluteUrl(product.thumbnail || product.media?.main || undefined);

  return {
    title: `${product.name} Graphic Tee | HORO Egypt`,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${product.name} Graphic Tee | HORO Egypt`,
      description,
      url: canonical,
      type: "website",
      images: image ? [{ url: image, alt: product.name }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: `${product.name} Graphic Tee | HORO Egypt`,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export function buildProductJsonLd(
  product: Product,
  catalog?: Pick<RuntimeCatalog, "feelings" | "occasions"> | null
) {
  return buildProductJsonLdSchema(product, { siteOrigin, catalog });
}
