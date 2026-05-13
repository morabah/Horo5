"use client";

import type { Occasion, Product } from "@/storefront/data/site";
import { RouterContextProvider } from "@/lib/router-context";
import { ShopByOccasion } from "@/storefront/pages/ShopByOccasion";

export function ShopByOccasionPage({
  initialOccasions,
  initialProducts,
  mode = "occasions",
}: {
  initialOccasions?: Occasion[];
  initialProducts?: Product[];
  mode?: "occasions" | "gifts";
}) {
  return (
    <RouterContextProvider>
      <ShopByOccasion initialOccasions={initialOccasions} initialProducts={initialProducts} mode={mode} />
    </RouterContextProvider>
  );
}
