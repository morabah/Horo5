"use client";

import { Cart } from "../../../../../web/src/pages/Cart";
import { RouterContextProvider } from "@/lib/router-context";

export default function Page() {
  return (
    <RouterContextProvider>
      <Cart />
    </RouterContextProvider>
  );
}
