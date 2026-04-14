"use client";

import { Checkout } from "@/storefront/pages/Checkout";
import { RouterContextProvider } from "@/lib/router-context";

export default function Page() {
  return (
    <RouterContextProvider>
      <Checkout />
    </RouterContextProvider>
  );
}
