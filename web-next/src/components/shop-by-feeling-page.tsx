"use client";

import { RouterContextProvider } from "@/lib/router-context";
import type { RuntimeCatalog } from "@/storefront/data/site";
import { ShopByFeeling } from "@/storefront/pages/ShopByFeeling";

export function ShopByFeelingPage({
  initialCatalog,
}: {
  initialCatalog?: Partial<RuntimeCatalog> | null;
}) {
  return (
    <RouterContextProvider>
      <ShopByFeeling initialCatalog={initialCatalog} />
    </RouterContextProvider>
  );
}
