"use client";

import { Terms } from "../../../../web/src/pages/Terms";
import { RouterContextProvider } from "@/lib/router-context";

export default function Page() {
  return (
    <RouterContextProvider>
      <Terms />
    </RouterContextProvider>
  );
}
