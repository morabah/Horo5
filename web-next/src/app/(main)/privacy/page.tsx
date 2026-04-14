"use client";

import { Privacy } from "@/storefront/pages/Privacy";
import { RouterContextProvider } from "@/lib/router-context";

export default function Page() {
  return (
    <RouterContextProvider>
      <Privacy />
    </RouterContextProvider>
  );
}
