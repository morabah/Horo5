"use client";

import { LegacyFeelingLineRedirect } from "@/components/legacy-feeling-line-redirect";
import { RouterContextProvider } from "@/lib/router-context";
import type { RuntimeCatalog } from "@/storefront/data/site";
import { FeelingCollection } from "@/storefront/pages/FeelingCollection";

export function FeelingCollectionPage({
  initialCatalog,
  initialSlug,
  initialSubfeelingSlug,
  enableLineRedirect,
}: {
  initialCatalog?: Partial<RuntimeCatalog> | null;
  initialSlug?: string;
  initialSubfeelingSlug?: string;
  enableLineRedirect?: boolean;
}) {
  return (
    <RouterContextProvider
      params={{
        slug: initialSlug,
        subfeelingSlug: initialSubfeelingSlug,
      }}
    >
      {enableLineRedirect ? <LegacyFeelingLineRedirect /> : null}
      <FeelingCollection
        initialCatalog={initialCatalog}
        initialSlug={initialSlug}
        initialSubfeelingSlug={initialSubfeelingSlug}
      />
    </RouterContextProvider>
  );
}
