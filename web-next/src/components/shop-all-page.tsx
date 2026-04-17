"use client";

import { RouterContextProvider } from "@/lib/router-context";
import { ShopAll } from "@/storefront/pages/ShopAll";

export function ShopAllPage() {
  return (
    <RouterContextProvider>
      <ShopAll />
    </RouterContextProvider>
  );
}
