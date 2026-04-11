"use client";

import type { Occasion } from "../../../web/src/data/site";
import { RouterContextProvider } from "@/lib/router-context";
import { ShopByOccasion } from "../../../web/src/pages/ShopByOccasion";

export function ShopByOccasionPage({ initialOccasions }: { initialOccasions?: Occasion[] }) {
  return (
    <RouterContextProvider>
      <ShopByOccasion initialOccasions={initialOccasions} />
    </RouterContextProvider>
  );
}
