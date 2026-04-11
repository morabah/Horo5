"use client";

import type { Product } from "../../../web/src/data/site";
import { RouterContextProvider } from "@/lib/router-context";
import { Home } from "../../../web/src/pages/Home";

export function HomePage({ initialProducts }: { initialProducts?: Product[] }) {
  return (
    <RouterContextProvider>
      <Home initialProducts={initialProducts} />
    </RouterContextProvider>
  );
}
