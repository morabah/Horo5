"use client";

import type { RuntimeCatalog, StorefrontHomepageSection } from "@/storefront/data/catalog-types";
import { RouterContextProvider } from "@/lib/router-context";
import { Home } from "@/storefront/pages/Home";

export function HomePage({
  homepageSections,
  initialCatalog,
  sectionsEnabled,
}: {
  homepageSections?: StorefrontHomepageSection[] | null;
  initialCatalog?: RuntimeCatalog | null;
  /** Backward-compatible section list from Medusa `store.metadata.homepage.sectionsEnabled`. */
  sectionsEnabled?: string[] | null;
}) {
  return (
    <RouterContextProvider>
      <Home
        homepageSections={homepageSections}
        initialCatalog={initialCatalog}
        sectionsEnabled={sectionsEnabled}
      />
    </RouterContextProvider>
  );
}
