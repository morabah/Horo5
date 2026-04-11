"use client";

import type { Occasion } from "../../../web/src/data/site";
import { RouterContextProvider } from "@/lib/router-context";
import { OccasionCollection } from "../../../web/src/pages/OccasionCollection";

export function OccasionCollectionPage({
  initialOccasion,
  initialSlug,
}: {
  initialOccasion?: Occasion | null;
  initialSlug?: string;
}) {
  return (
    <RouterContextProvider params={initialSlug ? { slug: initialSlug } : undefined}>
      <OccasionCollection initialOccasion={initialOccasion} initialSlug={initialSlug} />
    </RouterContextProvider>
  );
}
