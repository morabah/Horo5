"use client";

import { ProductDetail } from "../../../../../web/src/pages/ProductDetail";
import { RouterContextProvider } from "@/lib/router-context";
import { useParams } from "next/navigation";

export default function Page() {
  const params = useParams();
  return (
    <RouterContextProvider params={params}>
      <ProductDetail />
    </RouterContextProvider>
  );
}
