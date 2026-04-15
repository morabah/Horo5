import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductDetailPage } from "@/components/product-detail-page";
import {
  buildProductJsonLd,
  buildProductMetadata,
  fetchStorefrontPdpServer,
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

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const pdp = await fetchStorefrontPdpServer(slug).catch((error) => {
    logStorefrontFetchError("[storefront] Failed to fetch PDP for product metadata", error, { slug });
    return null;
  });

  const product = pdp?.product;
  if (!product) {
    return {
      title: "Page not found | HORO Egypt",
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  return buildProductMetadata(product, undefined);
}

export default async function Page({ params }: ProductPageProps) {
  const { slug } = await params;
  const pdp = await fetchStorefrontPdpServer(slug).catch((error) => {
    logStorefrontFetchError("[storefront] Failed to fetch PDP for product page", error, { slug });
    return null;
  });

  if (!pdp?.product) {
    notFound();
  }

  const { product, settings: storefrontSettings, crossSellProducts } = pdp;

  const deliveryRules: PdpDeliveryRules = mergePdpDeliveryRules(storefrontSettings?.delivery ?? null);
  const sizeTableConfig: PdpSizeTableConfig = mergePdpSizeTableConfig(storefrontSettings ?? undefined, product.sizeTableKey);

  const jsonLd = buildProductJsonLd(product, undefined, storefrontSettings?.delivery ?? null);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }}
      />
      <ProductDetailPage
        slug={slug}
        product={product}
        catalog={null}
        catalogProducts={crossSellProducts}
        deliveryRules={deliveryRules}
        sizeTableConfig={sizeTableConfig}
      />
    </>
  );
}
