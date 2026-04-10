"use client";

import { NotFound } from "../../../web/src/pages/NotFound";
import { RouterContextProvider } from "@/lib/router-context";

export default function NotFoundPage() {
  return (
    <RouterContextProvider>
      <NotFound />
    </RouterContextProvider>
  );
}
