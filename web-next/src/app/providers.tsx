"use client";

import { Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import { AnalyticsRoot } from "../../../web/src/analytics/AnalyticsRoot";
import { AppProviders } from "../../../web/src/AppProviders";
import type { RuntimeCatalog } from "../../../web/src/data/site";

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
    <HelmetProvider>
      <Suspense fallback={null}>
        <AnalyticsRoot />
      </Suspense>
      <AppProviders
        initialCatalog={initialCatalog}
        renderedAt={renderedAt}
        skipCatalogHydration={skipCatalogHydration}
      >
        {children}
      </AppProviders>
    </HelmetProvider>
  );
}
