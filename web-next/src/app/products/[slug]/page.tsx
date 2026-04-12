import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductDetailPage } from "@/components/product-detail-page";
import {
  buildProductJsonLd,
  buildProductMetadata,
  fetchStorefrontCatalogServer,
  fetchStorefrontProductServer,
  getStorefrontServerBaseUrl,
} from "@/lib/storefront-server";

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
      console.error("[storefront] Failed to fetch catalog for product metadata", {
        baseUrl: getStorefrontServerBaseUrl(),
        slug,
        error,
      });
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
  const [product, catalog] = await Promise.all([
    fetchStorefrontProductServer(slug),
    fetchStorefrontCatalogServer().catch((error) => {
      console.error("[storefront] Failed to fetch catalog for product page", {
        baseUrl: getStorefrontServerBaseUrl(),
        slug,
        error,
      });
      return null;
    }),
  ]);

  if (!product) {
    notFound();
  }

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
      />
    </>
  );
}
