"use client";

import { RouterContextProvider } from "@/lib/router-context";
import { Search } from "../../../web/src/pages/Search";

export function SearchPage() {
  return (
    <RouterContextProvider>
      <Search />
    </RouterContextProvider>
  );
}
