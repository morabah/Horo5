"use client";

import type { RuntimeCatalog } from "@/storefront/data/catalog-types";
import { RouterContextProvider } from "@/lib/router-context";
import { Home } from "@/storefront/pages/Home";

export function HomePage({
  initialCatalog,
  sectionsEnabled,
}: {
  initialCatalog?: RuntimeCatalog | null;
  /** Operator-controlled section list from Medusa `store.metadata.homepage.sectionsEnabled`. */
  sectionsEnabled?: string[] | null;
}) {
  return (
    <RouterContextProvider>
      <Home initialCatalog={initialCatalog} sectionsEnabled={sectionsEnabled} />
    </RouterContextProvider>
  );
}
