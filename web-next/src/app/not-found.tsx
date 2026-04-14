"use client";

import { NotFound } from "@/storefront/pages/NotFound";
import { RouterContextProvider } from "@/lib/router-context";

export default function NotFoundPage() {
  return (
    <RouterContextProvider>
      <NotFound />
    </RouterContextProvider>
  );
}
