"use client";

import { Home } from "../../../web/src/pages/Home";
import { RouterContextProvider } from "@/lib/router-context";

export default function Page() {
  return (
    <RouterContextProvider>
      <Home />
    </RouterContextProvider>
  );
}
