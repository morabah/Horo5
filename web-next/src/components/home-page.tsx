"use client";

import type { RuntimeCatalog } from "@/storefront/data/catalog-types";
import { RouterContextProvider } from "@/lib/router-context";
import { Home } from "@/storefront/pages/Home";

export function HomePage({ initialCatalog }: { initialCatalog?: RuntimeCatalog | null }) {
  return (
    <RouterContextProvider>
      <Home initialCatalog={initialCatalog} />
    </RouterContextProvider>
  );
}
