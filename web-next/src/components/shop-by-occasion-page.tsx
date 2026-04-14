"use client";

import type { Occasion } from "@/storefront/data/site";
import { RouterContextProvider } from "@/lib/router-context";
import { ShopByOccasion } from "@/storefront/pages/ShopByOccasion";

export function ShopByOccasionPage({ initialOccasions }: { initialOccasions?: Occasion[] }) {
  return (
    <RouterContextProvider>
      <ShopByOccasion initialOccasions={initialOccasions} />
    </RouterContextProvider>
  );
}
