"use client";

import { Exchange } from "@/storefront/pages/Exchange";
import { RouterContextProvider } from "@/lib/router-context";

export default function Page() {
  return (
    <RouterContextProvider>
      <Exchange />
    </RouterContextProvider>
  );
}
