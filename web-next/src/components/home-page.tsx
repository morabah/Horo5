"use client";

import type { RuntimeCatalog } from "../../../web/src/data/catalog-types";
import { RouterContextProvider } from "@/lib/router-context";
import { Home } from "../../../web/src/pages/Home";

export function HomePage({ initialCatalog }: { initialCatalog?: RuntimeCatalog | null }) {
  return (
    <RouterContextProvider>
      <Home initialCatalog={initialCatalog} />
    </RouterContextProvider>
  );
}
