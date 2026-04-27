import { cache } from "react";
import type { Metadata } from "next";

import {
  type Artist,
  getFeeling,
  type Feeling,
  type MerchEvent,
  type Occasion,
  type Product,
  type RuntimeCatalog,
  type Subfeeling,
} from "@/storefront/data/site";
import { mergePdpDeliveryRules, parseJsonLdStandardShippingEgpFromStoreDelivery } from "@/storefront/data/domain-config";
import {
  normalizeStorefrontProductApi,
  type StorefrontProductApi,
} from "@/storefront/lib/medusa/normalize-storefront-product";
import { buildProductJsonLdSchema, type ProductJsonLdShippingHint } from "@/storefront/seo/product-jsonld-schema";

function feelingFromCatalog(slug: string, catalog: Pick<RuntimeCatalog, "feelings"> | null | undefined): Feeling | undefined {
  if (catalog?.feelings?.length) {
    return catalog.feelings.find((f) => f.slug === slug);
  }
  return getFeeling(slug);
}

type NextFetchOptions = RequestInit & {
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
};

type StorefrontProductResponse = StorefrontProductApi;

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

function normalizeProduct(product: StorefrontProductResponse): Product {
  return normalizeStorefrontProductApi(product);
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

type StorefrontPdpApiResponse = {
  product: StorefrontProductResponse;
  settings: StorefrontSettingsResponse;
  crossSellProducts: StorefrontProductResponse[];
};

function normalizeStorefrontSettings(data: StorefrontSettingsResponse | null | undefined): StorefrontSettingsPayload {
  return {
    delivery: data?.delivery ?? null,
    sizeTables: data?.sizeTables ?? null,
    defaultSizeTableKey:
      typeof data?.defaultSizeTableKey === "string" && data.defaultSizeTableKey.trim()
        ? data.defaultSizeTableKey.trim()
        : null,
    navigation: data?.navigation
      ? {
          primary: (data.navigation.primary || []).map((item) => ({ ...item })),
          drawer: (data.navigation.drawer || []).map((item) => ({ ...item })),
        }
      : null,
    checkout: data?.checkout
      ? {
          governorates: (data.checkout.governorates || []).map((item) => ({ ...item })),
          paymentMethodOrder: [...(data.checkout.paymentMethodOrder || [])],
        }
      : null,
    search: data?.search
      ? {
          priceBands: (data.search.priceBands || []).map((item) => ({ ...item })),
        }
      : null,
    homepage: data?.homepage
      ? {
          sectionsEnabled: data.homepage.sectionsEnabled
            ? [...data.homepage.sectionsEnabled]
            : null,
        }
      : null,
  };
}

async function fetchStorefrontPdpServerImpl(
  slug: string,
  init: NextFetchOptions = {}
): Promise<{
  product: Product;
  settings: StorefrontSettingsPayload;
  crossSellProducts: Product[];
} | null> {
  try {
    const data = await storefrontRequest<StorefrontPdpApiResponse>(
      `/storefront/pdp/${encodeURIComponent(slug)}`,
      init
    );
    if (!data.product) {
      return null;
    }
    return {
      product: normalizeProduct(data.product),
      settings: normalizeStorefrontSettings(data.settings),
      crossSellProducts: (data.crossSellProducts || []).map(normalizeProduct),
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes("(404)")) {
      return null;
    }

    throw error;
  }
}

/**
 * Single PDP payload: product + store settings + cross-sell products (replaces separate catalog + product + settings calls).
 */
export const fetchStorefrontPdpServer = cache((slug: string) =>
  fetchStorefrontPdpServerImpl(slug, {
    next: {
      revalidate: 60,
      tags: [
        "catalog",
        "storefront",
        "settings",
        "product",
        `product:${encodeURIComponent(slug)}`,
      ],
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

type StorefrontLocalizedTextRaw = string | { en?: string; ar?: string };

type StorefrontNavItemRaw = {
  key: string;
  label: StorefrontLocalizedTextRaw;
  href: string;
  badge?: StorefrontLocalizedTextRaw;
  active: boolean;
  sortOrder: number;
};

type StorefrontGovernorateRaw = {
  code: string;
  name: StorefrontLocalizedTextRaw;
  codEligible: boolean;
  expressEligible: boolean;
};

type StorefrontPriceBandRaw = {
  key: string;
  minEgp: number | null;
  maxEgp: number | null;
  label: StorefrontLocalizedTextRaw;
};

type StorefrontSettingsResponse = {
  delivery?: unknown | null;
  sizeTables?: unknown | null;
  defaultSizeTableKey?: string | null;
  navigation?: { primary: StorefrontNavItemRaw[]; drawer: StorefrontNavItemRaw[] } | null;
  checkout?: { governorates: StorefrontGovernorateRaw[]; paymentMethodOrder: string[] } | null;
  search?: { priceBands: StorefrontPriceBandRaw[] } | null;
  homepage?: { sectionsEnabled: string[] | null } | null;
};

/** Localized text — operators provide either a flat string or {en, ar}. */
export type StorefrontLocalizedText = string | { en?: string; ar?: string };

export type StorefrontNavItem = {
  key: string;
  label: StorefrontLocalizedText;
  href: string;
  badge?: StorefrontLocalizedText;
  active: boolean;
  sortOrder: number;
};

export type StorefrontGovernorate = {
  code: string;
  name: StorefrontLocalizedText;
  codEligible: boolean;
  expressEligible: boolean;
};

export type StorefrontPriceBand = {
  key: string;
  /** Inclusive min in EGP, null = no minimum. */
  minEgp: number | null;
  /** Inclusive max in EGP, null = no maximum. */
  maxEgp: number | null;
  label: StorefrontLocalizedText;
};

/** Medusa `GET /storefront/settings` payload. */
export type StorefrontSettingsPayload = {
  delivery: unknown | null;
  sizeTables: unknown | null;
  defaultSizeTableKey: string | null;
  navigation: { primary: StorefrontNavItem[]; drawer: StorefrontNavItem[] } | null;
  checkout: { governorates: StorefrontGovernorate[]; paymentMethodOrder: string[] } | null;
  search: { priceBands: StorefrontPriceBand[] } | null;
  /** Operator-controlled homepage layout. When null, storefront uses its built-in 5-section default. */
  homepage: { sectionsEnabled: string[] | null } | null;
};

async function fetchStorefrontSettingsServerImpl(): Promise<StorefrontSettingsPayload | null> {
  try {
    const data = await storefrontRequest<StorefrontSettingsResponse>("/storefront/settings", {
      next: {
        revalidate: 300,
        tags: ["storefront", "settings"],
      },
    });
    return normalizeStorefrontSettings(data);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[storefront] GET /storefront/settings failed — PDP delivery, size tables, navigation, and checkout fall back to defaults.",
        error instanceof Error ? error.message : error,
      );
    }
    return null;
  }
}

/**
 * Global storefront settings from Medusa (`store.metadata.delivery`, `sizeTables`, `defaultSizeTableKey`).
 * Cached with `revalidate: 300` and tag `settings`; bust via Medusa `store.updated` → `POST /api/revalidate/storefront`.
 */
export const fetchStorefrontSettingsServer = cache(fetchStorefrontSettingsServerImpl);

/** Display-only projection of native Medusa Promotions and the gift-wrap product. */
export type StorefrontIncentivesPayload = {
  freeShipping: {
    promotionId: string;
    thresholdEgp: number;
    currency: string;
    label: StorefrontLocalizedText;
  } | null;
  bundle: {
    promotionId: string;
    type: "buyget";
    requireQuantity: number;
    applyToQuantity: number;
    applicationValue: number;
    applicationKind: "fixed" | "percentage";
    label: StorefrontLocalizedText;
  } | null;
  giftWrapProductHandle: string | null;
  giftWrapPriceEgp: number | null;
  giftWrapLabel: StorefrontLocalizedText | null;
};

async function fetchStorefrontIncentivesServerImpl(): Promise<StorefrontIncentivesPayload | null> {
  try {
    const data = await storefrontRequest<StorefrontIncentivesPayload>("/storefront/incentives", {
      next: {
        revalidate: 300,
        tags: ["storefront", "incentives"],
      },
    });
    return data ?? null;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[storefront] GET /storefront/incentives failed — free shipping / bundle UI degrades to off.",
        error instanceof Error ? error.message : error,
      );
    }
    return null;
  }
}

/**
 * Display-only incentives payload (free shipping threshold + bundle label + gift wrap handle).
 * Cached with `revalidate: 300` and tag `incentives`; bust via Medusa `promotion.updated` /
 * `product.updated` (when gift-wrap price changes) → `POST /api/revalidate/storefront`.
 *
 * The cart math is **always** computed by Medusa (auto-applied Promotions); this payload only
 * powers progress bars, upsell strips, and the gift-wrap toggle copy.
 */
export const fetchStorefrontIncentivesServer = cache(fetchStorefrontIncentivesServerImpl);

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

export function buildFeelingMetadata(feeling: Feeling, subfeeling?: Subfeeling | null): Metadata {
  const titleSource = subfeeling?.seoTitle || feeling.seoTitle;
  const title =
    titleSource ||
    (subfeeling
      ? `${feeling.name} / ${subfeeling.name} Graphic Tees | HORO Egypt`
      : `${feeling.name} Graphic Tees | HORO Egypt`);
  const description =
    subfeeling?.seoDescription ||
    feeling.seoDescription ||
    subfeeling?.blurb ||
    feeling.blurb ||
    feeling.tagline ||
    `Shop ${feeling.name} graphic tees from HORO Egypt with COD and 14-day exchange in Egypt.`;
  const path = subfeeling
    ? `/feelings/${feeling.slug}/${subfeeling.slug}`
    : `/feelings/${feeling.slug}`;
  const canonical = siteOrigin ? `${siteOrigin}${path}` : path;
  const image = toAbsoluteUrl(
    subfeeling?.heroImageSrc ||
      subfeeling?.cardImageSrc ||
      feeling.heroImageSrc ||
      feeling.cardImageSrc,
  );
  const imageAlt =
    subfeeling?.heroImageAlt ||
    subfeeling?.cardImageAlt ||
    feeling.heroImageAlt ||
    feeling.cardImageAlt ||
    title;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      images: image ? [{ url: image, alt: imageAlt }] : undefined,
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

  const arUrl = siteOrigin ? `${siteOrigin}/products/${product.slug}?uiLocale=ar` : undefined;

  return {
    title: `${product.name} Graphic Tee | HORO Egypt`,
    description,
    alternates: {
      canonical,
      ...(siteOrigin
        ? {
            languages: {
              en: `${siteOrigin}/products/${product.slug}`,
              ...(arUrl ? { ar: arUrl } : {}),
            },
          }
        : {}),
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
  catalog?: Pick<RuntimeCatalog, "feelings" | "occasions"> | null,
  /** Medusa `GET /storefront/settings` → `delivery`; used for optional JSON-LD shipping only when `jsonLdStandardShippingEgp` is set. */
  storeDelivery?: unknown | null,
) {
  const priceEgp = parseJsonLdStandardShippingEgpFromStoreDelivery(storeDelivery ?? null);
  const rules = mergePdpDeliveryRules(storeDelivery ?? null);
  let jsonLdShipping: ProductJsonLdShippingHint | null = null;
  if (priceEgp != null) {
    jsonLdShipping = {
      priceEgp,
      transitMinDays: rules.standardMinDays,
      transitMaxDays: rules.standardMaxDays,
    };
  }
  return buildProductJsonLdSchema(product, { siteOrigin, catalog: catalog ?? null, jsonLdShipping });
}
