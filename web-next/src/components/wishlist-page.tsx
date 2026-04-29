"use client";

import { RouterContextProvider } from "@/lib/router-context";
import type { RuntimeCatalog } from "@/storefront/data/site";
import { Wishlist } from "@/storefront/pages/Wishlist";

export function WishlistPage({
  initialCatalog = null,
}: {
  initialCatalog?: Partial<RuntimeCatalog> | null;
}) {
  return (
    <RouterContextProvider>
      <Wishlist initialCatalog={initialCatalog} />
    </RouterContextProvider>
  );
}
