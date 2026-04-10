"use client";

import { HelmetProvider } from "react-helmet-async";
import { AppProviders } from "../../../web/src/AppProviders";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HelmetProvider>
      <AppProviders>{children}</AppProviders>
    </HelmetProvider>
  );
}
