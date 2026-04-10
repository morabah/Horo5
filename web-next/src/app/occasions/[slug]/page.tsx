"use client";

import { OccasionCollection } from "../../../../../web/src/pages/OccasionCollection";
import { RouterContextProvider } from "@/lib/router-context";
import { useParams } from "next/navigation";

export default function Page() {
  const params = useParams();
  return (
    <RouterContextProvider params={params}>
      <OccasionCollection />
    </RouterContextProvider>
  );
}
