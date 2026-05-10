"use client";

import type { ReactNode } from "react";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { AppErrorBoundary } from "./app-error-boundary";
import { FunnelNavigationTracker } from "@/storefront/components/FunnelNavigationTracker";
import { Nav } from "@/storefront/components/Nav";
import { Footer } from "@/storefront/components/Footer";
import type { StorefrontSettingsPayload } from "@/lib/storefront-server";
import { LaunchCountdownBanner } from "@/storefront/components/LaunchCountdownBanner";
import { ConsentBanner } from "@/storefront/components/ConsentBanner";
import { SkipLink } from "@/storefront/components/SkipLink";

/** App shell for main storefront pages: skip link, nav, footer, analytics wrapper. */
export function StorefrontChrome({
  children,
  navigation = null,
  launchAt = null,
}: {
  children: ReactNode;
  navigation?: StorefrontSettingsPayload["navigation"];
  launchAt?: string | null;
}) {
  const pathname = usePathname() ?? "/";
  const isHome = pathname === "/";

  return (
    <>
      <SkipLink />
      <FunnelNavigationTracker />
      {launchAt ? <LaunchCountdownBanner launchAt={launchAt} /> : null}
      <Suspense fallback={null}>
        <Nav navigation={navigation} />
      </Suspense>
      <main id="main-content" className={isHome ? "" : "pt-32 md:pt-24"}>
        <AppErrorBoundary key={pathname}>{children}</AppErrorBoundary>
      </main>
      <Footer />
      <ConsentBanner />
    </>
  );
}
