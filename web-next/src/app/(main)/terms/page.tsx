"use client";

import { Terms } from "@/storefront/pages/Terms";
import { RouterContextProvider } from "@/lib/router-context";

export default function Page() {
  return (
    <RouterContextProvider>
      <Terms />
    </RouterContextProvider>
  );
}
