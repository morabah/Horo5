"use client";

import type { Product, RuntimeCatalog } from "../../../web/src/data/site";
import { ProductDetail } from "../../../web/src/pages/ProductDetail";

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
      renderJsonLd={false}
    />
  );
}
