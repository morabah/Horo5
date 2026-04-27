"use client";

import { RouterContextProvider } from "@/lib/router-context";
import type { StorefrontPriceBand } from "@/lib/storefront-server";
import { ShopAll } from "@/storefront/pages/ShopAll";

export function ShopAllPage({ priceBands = null }: { priceBands?: StorefrontPriceBand[] | null }) {
  return (
    <RouterContextProvider>
      <ShopAll priceBands={priceBands} />
    </RouterContextProvider>
  );
}
