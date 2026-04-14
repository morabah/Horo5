"use client";

import { About } from "../../../../../web/src/pages/About";
import { RouterContextProvider } from "@/lib/router-context";

export default function Page() {
  return (
    <RouterContextProvider>
      <About />
    </RouterContextProvider>
  );
}
