"use client";

import type { ReactNode } from "react";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { AppErrorBoundary } from "./app-error-boundary";
import { FunnelNavigationTracker } from "@/storefront/components/FunnelNavigationTracker";
import { Nav } from "@/storefront/components/Nav";
import { Footer } from "@/storefront/components/Footer";
import type { StorefrontIncentivesPayload, StorefrontSettingsPayload } from "@/lib/storefront-server";
import { LaunchCountdownBanner } from "@/storefront/components/LaunchCountdownBanner";
import { TimedOfferBanner } from "@/storefront/components/TimedOfferBanner";
import { ConsentBanner } from "@/storefront/components/ConsentBanner";
import { SkipLink } from "@/storefront/components/SkipLink";
import { AnnouncementBar } from "@/storefront/components/AnnouncementBar";

/** App shell for main storefront pages: skip link, nav, footer, analytics wrapper. */
export function StorefrontChrome({
  children,
  navigation = null,
  launchAt = null,
  timedOffer = null,
  announcementBar = null,
}: {
  children: ReactNode;
  navigation?: StorefrontSettingsPayload["navigation"];
  launchAt?: string | null;
  timedOffer?: StorefrontIncentivesPayload["timedOffer"];
  announcementBar?: StorefrontSettingsPayload["announcementBar"];
}) {
  const pathname = usePathname() ?? "/";
  const isHome = pathname === "/";

  return (
    <>
      <SkipLink />
      <FunnelNavigationTracker />
      {launchAt ? <LaunchCountdownBanner launchAt={launchAt} /> : null}
      {timedOffer ? <TimedOfferBanner offer={timedOffer} /> : null}
      <div className="horo-chrome-stack fixed top-0 z-100 w-full">
        <AnnouncementBar config={announcementBar} isHome={isHome} />
        <Suspense fallback={null}>
          <Nav navigation={navigation} overlayOnHero={isHome} />
        </Suspense>
      </div>
      <main id="main-content" className={isHome ? "" : "pt-32 md:pt-24"}>
        <AppErrorBoundary key={pathname}>{children}</AppErrorBoundary>
      </main>
      <Footer />
      <ConsentBanner />
    </>
  );
}
