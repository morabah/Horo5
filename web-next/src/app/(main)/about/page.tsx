"use client";

import { About } from "@/storefront/pages/About";
import { RouterContextProvider } from "@/lib/router-context";

export default function Page() {
  return (
    <RouterContextProvider>
      <About />
    </RouterContextProvider>
  );
}
