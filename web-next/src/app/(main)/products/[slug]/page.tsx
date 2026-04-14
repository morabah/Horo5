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
import { mergePdpDeliveryRules, mergePdpSizeTableConfig, type PdpSizeTableConfig } from "@/storefront/data/domain-config";
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
  const [product, catalog, storefrontSettings] = await Promise.all([
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

  if (process.env.NODE_ENV === "development" && storefrontSettings == null) {
    console.warn(
      "[pdp] GET /storefront/settings failed or empty — using built-in delivery windows and size tables. Check Medusa and publishable key.",
    );
  }

  const deliveryRules: PdpDeliveryRules = mergePdpDeliveryRules(storefrontSettings?.delivery ?? null);
  const sizeTableConfig: PdpSizeTableConfig = mergePdpSizeTableConfig(storefrontSettings ?? undefined, product.sizeTableKey);

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
        sizeTableConfig={sizeTableConfig}
      />
    </>
  );
}
