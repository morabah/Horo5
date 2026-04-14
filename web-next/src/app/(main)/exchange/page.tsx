"use client";

import { Exchange } from "../../../../../web/src/pages/Exchange";
import { RouterContextProvider } from "@/lib/router-context";

export default function Page() {
  return (
    <RouterContextProvider>
      <Exchange />
    </RouterContextProvider>
  );
}
