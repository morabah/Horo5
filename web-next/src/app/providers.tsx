"use client";

import { Suspense } from "react";
import { AnalyticsRoot } from "@/storefront/analytics/AnalyticsRoot";
import { AppProviders } from "@/storefront/AppProviders";
import { RouteLoadingSpinner } from "@/storefront/components/RouteLoadingSpinner";
import type { RuntimeCatalog } from "@/storefront/data/site";

export function Providers({
  children,
  initialCatalog,
  renderedAt,
  skipCatalogHydration,
}: {
  children: React.ReactNode;
  initialCatalog?: Partial<RuntimeCatalog> | null;
  renderedAt?: string | null;
  /** Skip client-side catalog fetch (checkout does not need full catalog). */
  skipCatalogHydration?: boolean;
}) {
  return (
    <>
      <Suspense fallback={<RouteLoadingSpinner />}>
        <AnalyticsRoot />
      </Suspense>
      <AppProviders
        initialCatalog={initialCatalog}
        renderedAt={renderedAt}
        skipCatalogHydration={skipCatalogHydration}
      >
        {children}
      </AppProviders>
    </>
  );
}
