"use client";

import type { Product, RuntimeCatalog } from "@/storefront/data/site";
import { ProductDetail } from "@/storefront/pages/ProductDetail";
import type { PdpDeliveryRules } from "@/storefront/utils/deliveryEstimate";

export function ProductDetailPage({
  slug,
  product,
  catalog,
  catalogProducts,
  deliveryRules,
}: {
  slug: string;
  product: Product;
  catalog?: Partial<RuntimeCatalog> | null;
  catalogProducts?: Product[];
  /** Merged on the server from Medusa `store.metadata.delivery` + defaults. */
  deliveryRules: PdpDeliveryRules;
}) {
  return (
    <ProductDetail
      catalogSnapshot={catalog}
      initialSlug={slug}
      initialProduct={product}
      catalogProducts={catalogProducts}
      deliveryRules={deliveryRules}
    />
  );
}
