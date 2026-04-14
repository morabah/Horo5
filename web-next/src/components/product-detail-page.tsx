"use client";

import type { Product, RuntimeCatalog } from "@/storefront/data/site";
import { ProductDetail } from "@/storefront/pages/ProductDetail";

export function ProductDetailPage({
  slug,
  product,
  catalog,
  catalogProducts,
}: {
  slug: string;
  product: Product;
  catalog?: Partial<RuntimeCatalog> | null;
  catalogProducts?: Product[];
}) {
  return (
    <ProductDetail
      catalogSnapshot={catalog}
      initialSlug={slug}
      initialProduct={product}
      catalogProducts={catalogProducts}
    />
  );
}
