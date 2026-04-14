"use client";

import { Checkout } from "../../../../../web/src/pages/Checkout";
import { RouterContextProvider } from "@/lib/router-context";

export default function Page() {
  return (
    <RouterContextProvider>
      <Checkout />
    </RouterContextProvider>
  );
}
