import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductDetailPage } from "@/components/product-detail-page";
import {
  buildProductJsonLd,
  buildProductMetadata,
  fetchStorefrontCatalogServer,
  fetchStorefrontProductServer,
  fetchStorefrontSettingsServer,
  logStorefrontFetchError,
} from "@/lib/storefront-server";
import { mergePdpDeliveryRules } from "@/storefront/data/domain-config";
import type { PdpDeliveryRules } from "@/storefront/utils/deliveryEstimate";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function jsonLdString(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const [product, catalog] = await Promise.all([
    fetchStorefrontProductServer(slug),
    fetchStorefrontCatalogServer().catch((error) => {
      logStorefrontFetchError("[storefront] Failed to fetch catalog for product metadata", error, { slug });
      return null;
    }),
  ]);

  if (!product) {
    return {
      title: "Page not found | HORO Egypt",
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  return buildProductMetadata(product, catalog ?? undefined);
}

export default async function Page({ params }: ProductPageProps) {
  const { slug } = await params;
  const [product, catalog, deliveryMetadata] = await Promise.all([
    fetchStorefrontProductServer(slug),
    fetchStorefrontCatalogServer().catch((error) => {
      logStorefrontFetchError("[storefront] Failed to fetch catalog for product page", error, { slug });
      return null;
    }),
    fetchStorefrontSettingsServer(),
  ]);

  if (!product) {
    notFound();
  }

  if (process.env.NODE_ENV === "development" && deliveryMetadata == null) {
    console.warn(
      "[pdp] No store.metadata.delivery from Medusa — using built-in delivery windows. Check Admin Store → Metadata (key `delivery`) and GET /storefront/settings.",
    );
  }

  const deliveryRules: PdpDeliveryRules = mergePdpDeliveryRules(deliveryMetadata);

  const jsonLd = buildProductJsonLd(product, catalog ?? undefined);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }}
      />
      <ProductDetailPage
        slug={slug}
        product={product}
        catalog={catalog}
        catalogProducts={catalog?.products}
        deliveryRules={deliveryRules}
      />
    </>
  );
}
