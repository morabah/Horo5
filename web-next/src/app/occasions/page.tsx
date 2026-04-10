"use client";

import { ShopByOccasion } from "../../../../web/src/pages/ShopByOccasion";
import { RouterContextProvider } from "@/lib/router-context";

export default function Page() {
  return (
    <RouterContextProvider>
      <ShopByOccasion />
    </RouterContextProvider>
  );
}
