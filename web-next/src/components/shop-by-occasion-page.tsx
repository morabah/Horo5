"use client";

import type { Occasion } from "@/storefront/data/site";
import { RouterContextProvider } from "@/lib/router-context";
import { ShopByOccasion } from "@/storefront/pages/ShopByOccasion";

export function ShopByOccasionPage({
  initialOccasions,
  mode = "occasions",
}: {
  initialOccasions?: Occasion[];
  mode?: "occasions" | "gifts";
}) {
  return (
    <RouterContextProvider>
      <ShopByOccasion initialOccasions={initialOccasions} mode={mode} />
    </RouterContextProvider>
  );
}
