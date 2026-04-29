"use client";

import { RouterContextProvider } from "@/lib/router-context";
import type { StorefrontPriceBand } from "@/lib/storefront-server";
import type { RuntimeCatalog } from "@/storefront/data/site";
import { ShopAll } from "@/storefront/pages/ShopAll";

export function ShopAllPage({
  initialCatalog = null,
  priceBands = null,
}: {
  initialCatalog?: Partial<RuntimeCatalog> | null;
  priceBands?: StorefrontPriceBand[] | null;
}) {
  return (
    <RouterContextProvider>
      <ShopAll initialCatalog={initialCatalog} priceBands={priceBands} />
    </RouterContextProvider>
  );
}
