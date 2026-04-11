"use client";

import { HelmetProvider } from "react-helmet-async";
import { AnalyticsRoot } from "../../../web/src/analytics/AnalyticsRoot";
import { AppProviders } from "../../../web/src/AppProviders";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HelmetProvider>
      <AnalyticsRoot />
      <AppProviders>{children}</AppProviders>
    </HelmetProvider>
  );
}
