"use client";

import { ShopByFeeling } from "../../../../web/src/pages/ShopByFeeling";
import { RouterContextProvider } from "@/lib/router-context";

export default function Page() {
  return (
    <RouterContextProvider>
      <ShopByFeeling />
    </RouterContextProvider>
  );
}
