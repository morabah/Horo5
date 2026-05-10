"use client";

import type { Product, RuntimeCatalog } from "@/storefront/data/site";
import { ProductDetail } from "@/storefront/pages/ProductDetail";
import type { PdpDeliveryRules } from "@/storefront/utils/deliveryEstimate";
import type { PdpSizeTableConfig } from "@/storefront/data/domain-config";
import type { PreLaunchPhase } from "@/lib/pre-launch";

export function ProductDetailPage({
  slug,
  product,
  catalog,
  catalogProducts,
  deliveryRules,
  sizeTableConfig,
  preLaunchPhase,
}: {
  slug: string;
  product: Product;
  catalog?: Partial<RuntimeCatalog> | null;
  catalogProducts?: Product[];
  /** Merged on the server from Medusa `store.metadata.delivery` + defaults. */
  deliveryRules: PdpDeliveryRules;
  /** Merged from `store.metadata.sizeTables` + product `sizeTableKey` + built-in fallback. */
  sizeTableConfig: PdpSizeTableConfig;
  preLaunchPhase: PreLaunchPhase;
}) {
  return (
    <ProductDetail
      catalogSnapshot={catalog}
      initialSlug={slug}
      initialProduct={product}
      catalogProducts={catalogProducts}
      deliveryRules={deliveryRules}
      sizeTableConfig={sizeTableConfig}
      preLaunchPhase={preLaunchPhase}
    />
  );
}
