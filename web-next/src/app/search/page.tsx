"use client";

import { Search } from "../../../../web/src/pages/Search";
import { RouterContextProvider } from "@/lib/router-context";

export default function Page() {
  return (
    <RouterContextProvider>
      <Search />
    </RouterContextProvider>
  );
}
