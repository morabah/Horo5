import type { Product, ProductVariantRecord, RuntimeCatalog } from "../data/catalog-types";

function feelingFromCatalogOnly(
  slug: string,
  catalog?: Pick<RuntimeCatalog, "feelings"> | null
): { name: string } | undefined {
  const row = catalog?.feelings?.find((f) => f.slug === slug);
  return row ? { name: row.name } : undefined;
}

function occasionNameFromCatalogOnly(
  slug: string,
  catalog?: Pick<RuntimeCatalog, "occasions"> | null
): string | undefined {
  return catalog?.occasions?.find((o) => o.slug === slug)?.name;
}

function toAbsoluteUrl(src: string, siteOrigin: string): string {
  if (!src) return src;
  if (/^https?:\/\//i.test(src)) return src;
  if (!siteOrigin) return src;
  return src.startsWith("/") ? `${siteOrigin}${src}` : `${siteOrigin}/${src}`;
}

/**
 * Schema.org Product JSON-LD from a storefront `Product` DTO (Medusa-backed).
 * Does not read local fixture files — pass `catalog` for feeling/occasion labels when needed.
 */
export type ProductJsonLdShippingHint = {
  /** From Medusa `store.metadata.delivery.jsonLdStandardShippingEgp` only. */
  priceEgp: number;
  transitMinDays: number;
  transitMaxDays: number;
};

export function buildProductJsonLdSchema(
  product: Product,
  options: {
    siteOrigin: string;
    catalog?: Pick<RuntimeCatalog, "feelings" | "occasions"> | null;
    /** When Medusa provides a display standard shipping EGP + PDP day window, emit OfferShippingDetails. */
    jsonLdShipping?: ProductJsonLdShippingHint | null;
  }
): Record<string, unknown> {
  const { siteOrigin, catalog, jsonLdShipping } = options;
  const feelingSlug = product.primaryFeelingSlug ?? product.feelingSlug;
  const feeling = feelingFromCatalogOnly(feelingSlug, catalog);
  const occasionNames =
    product.pdpTagLabels && product.pdpTagLabels.length > 0
      ? product.pdpTagLabels
      : product.occasionSlugs
          .map((occasionSlug) => occasionNameFromCatalogOnly(occasionSlug, catalog))
          .filter((value): value is string => Boolean(value));
  const images = Array.from(
    new Set(
      [product.thumbnail, product.media?.main, ...(product.media?.gallery || [])]
        .filter((value): value is string => Boolean(value))
        .map((src) => toAbsoluteUrl(src, siteOrigin))
    )
  );
  const inStock =
    Object.values(product.variantsBySize || {}).length === 0 ||
    Object.values(product.variantsBySize || {}).some((variant) => variant?.available);
  const productUrl = siteOrigin ? `${siteOrigin}/products/${product.slug}` : `/products/${product.slug}`;

  const variantEntries = Object.entries(product.variantsBySize ?? {}).filter(
    (entry): entry is [string, ProductVariantRecord] => {
      const v = entry[1];
      return v != null && typeof v.priceEgp === "number";
    },
  );
  const variantPrices = variantEntries.map(([, v]) => v.priceEgp);
  const useAggregate =
    variantPrices.length > 1 ||
    (variantPrices.length === 1 && variantPrices[0] !== product.priceEgp);

  const shippingDetailsBlock =
    jsonLdShipping != null &&
    jsonLdShipping.priceEgp >= 0 &&
    jsonLdShipping.transitMinDays > 0 &&
    jsonLdShipping.transitMaxDays >= jsonLdShipping.transitMinDays
      ? {
          shippingDetails: {
            "@type": "OfferShippingDetails",
            shippingRate: {
              "@type": "MonetaryAmount",
              value: String(jsonLdShipping.priceEgp),
              currency: "EGP",
            },
            shippingDestination: {
              "@type": "DefinedRegion",
              addressCountry: "EG",
            },
            deliveryTime: {
              "@type": "ShippingDeliveryTime",
              transitTime: {
                "@type": "QuantitativeValue",
                minValue: jsonLdShipping.transitMinDays,
                maxValue: jsonLdShipping.transitMaxDays,
                unitCode: "DAY",
              },
            },
          },
        }
      : {};

  const offers: Record<string, unknown> = useAggregate
    ? {
        "@type": "AggregateOffer",
        url: productUrl,
        priceCurrency: "EGP",
        lowPrice: String(Math.min(...variantPrices)),
        highPrice: String(Math.max(...variantPrices)),
        offerCount: variantEntries.length,
        availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/NewCondition",
        ...shippingDetailsBlock,
      }
    : {
        "@type": "Offer",
        url: productUrl,
        priceCurrency: "EGP",
        price: String(product.priceEgp),
        availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/NewCondition",
        ...shippingDetailsBlock,
      };

  const returnPolicyUrl = siteOrigin ? `${siteOrigin.replace(/\/$/, "")}/exchange` : null;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || product.story,
    image: images.length > 0 ? images : undefined,
    sku: product.slug,
    url: productUrl,
    brand: {
      "@type": "Brand",
      name: "HORO Egypt",
    },
    ...(feeling ? { category: `${feeling.name} graphic tee` } : {}),
    ...(occasionNames.length > 0 ? { keywords: occasionNames.join(", ") } : {}),
    ...(variantEntries.length > 0
      ? {
          additionalProperty: variantEntries.map(([sizeKey, v]) => ({
            "@type": "PropertyValue",
            name: "size",
            value: sizeKey,
            ...(typeof v.sku === "string" && v.sku.trim() ? { identifier: v.sku.trim() } : {}),
          })),
        }
      : {}),
    offers,
    ...(returnPolicyUrl
      ? {
          hasMerchantReturnPolicy: {
            "@type": "MerchantReturnPolicy",
            applicableCountry: "EG",
            returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
            merchantReturnDays: 14,
            returnPolicyUrl: returnPolicyUrl,
          },
        }
      : {}),
  };
}
