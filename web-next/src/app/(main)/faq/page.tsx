"use client";

import { RouterContextProvider } from "@/lib/router-context";
import { FAQ } from "@/storefront/pages/FAQ";

export default function Page() {
  return (
    <RouterContextProvider>
      <FAQ />
    </RouterContextProvider>
  );
}
