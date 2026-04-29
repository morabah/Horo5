"use client";

import { RouterContextProvider } from "@/lib/router-context";
import type { RuntimeCatalog } from "@/storefront/data/site";
import { Search } from "@/storefront/pages/Search";

export function SearchPage({ initialCatalog = null }: { initialCatalog?: Partial<RuntimeCatalog> | null }) {
  return (
    <RouterContextProvider>
      <Search initialCatalog={initialCatalog} />
    </RouterContextProvider>
  );
}
