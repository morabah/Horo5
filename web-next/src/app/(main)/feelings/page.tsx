"use client";

import { ShopByFeeling } from "@/storefront/pages/ShopByFeeling";
import { RouterContextProvider } from "@/lib/router-context";

export default function Page() {
  return (
    <RouterContextProvider>
      <ShopByFeeling />
    </RouterContextProvider>
  );
}
