"use client";

import { Cart } from "@/storefront/pages/Cart";
import { RouterContextProvider } from "@/lib/router-context";

export default function Page() {
  return (
    <RouterContextProvider>
      <Cart />
    </RouterContextProvider>
  );
}
