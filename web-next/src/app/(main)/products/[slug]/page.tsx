import type { Metadata } from "next";
import { Suspense } from "react";
import { unstable_noStore } from "next/cache";
import { notFound } from "next/navigation";

import { ProductDetailPage } from "@/components/product-detail-page";
import {
  buildProductJsonLd,
  buildProductMetadata,
  fetchStorefrontCatalogServer,
  fetchStorefrontPdpServer,
  logStorefrontFetchError,
} from "@/lib/storefront-server";
import { mergePdpDeliveryRules, mergePdpSizeTableConfig, type PdpSizeTableConfig } from "@/storefront/data/domain-config";
import type { PdpDeliveryRules } from "@/storefront/utils/deliveryEstimate";
import { getPreLaunchPhase } from "@/lib/pre-launch";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    preview?: string;
  }>;
};

export const revalidate = 60;

function jsonLdString(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const catalog = await fetchStorefrontCatalogServer().catch((error) => {
    logStorefrontFetchError("[storefront] Failed to fetch catalog for PDP static params", error);
    return null;
  });

  return (catalog?.products ?? [])
    .map((product) => product.slug)
    .filter((slug): slug is string => Boolean(slug))
    .map((slug) => ({ slug }));
}

function isPreviewValue(value: string | undefined) {
  return value === "1" || value === "true";
}

export async function generateMetadata({ params, searchParams }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const preview = isPreviewValue((await searchParams)?.preview);
  if (preview) {
    unstable_noStore();
  }
  const pdp = await fetchStorefrontPdpServer(slug, preview).catch((error) => {
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

  const baseMetadata = buildProductMetadata(product, undefined);
  if (preview) {
    baseMetadata.robots = { index: false, follow: true };
  }
  return baseMetadata;
}

export default async function Page({ params, searchParams }: ProductPageProps) {
  const phase = getPreLaunchPhase();

  if (phase === "tease") {
    notFound();
  }

  const { slug } = await params;
  const preview = isPreviewValue((await searchParams)?.preview);
  if (preview) {
    unstable_noStore();
  }
  const pdp = await fetchStorefrontPdpServer(slug, preview).catch((error) => {
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
      <Suspense fallback={null}>
        <ProductDetailPage
          slug={slug}
          product={product}
          catalog={null}
          catalogProducts={crossSellProducts}
          deliveryRules={deliveryRules}
          sizeTableConfig={sizeTableConfig}
          preLaunchPhase={phase}
        />
      </Suspense>
    </>
  );
}
