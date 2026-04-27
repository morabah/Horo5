"use client";

import type { ReactNode } from "react";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { AppErrorBoundary } from "./app-error-boundary";
import { FunnelNavigationTracker } from "@/storefront/components/FunnelNavigationTracker";
import { Nav } from "@/storefront/components/Nav";
import { Footer } from "@/storefront/components/Footer";
import { RouteLoadingSpinner } from "@/storefront/components/RouteLoadingSpinner";
import { PageSkeleton } from "@/storefront/components/ui/Skeleton";
import type { StorefrontSettingsPayload } from "@/lib/storefront-server";

/** App shell for main storefront pages: skip link, nav, footer, analytics wrapper. */
export function StorefrontChrome({
  children,
  navigation = null,
}: {
  children: ReactNode;
  navigation?: StorefrontSettingsPayload["navigation"];
}) {
  const pathname = usePathname() ?? "/";
  const isHome = pathname === "/";

  return (
    <>
      <a
        href="#main-content"
        className="sr-only left-4 top-[max(0.75rem,env(safe-area-inset-top))] z-[300] rounded-sm border border-outline-variant/50 bg-papyrus px-4 py-3 font-label text-[11px] font-semibold uppercase tracking-widest text-obsidian shadow-md outline-none ring-deep-teal focus:not-sr-only focus:fixed focus:ring-2"
      >
        Skip to main content
      </a>
      <Suspense fallback={<RouteLoadingSpinner />}>
        <FunnelNavigationTracker />
        <Nav navigation={navigation} />
      </Suspense>
      <main id="main-content" className={isHome ? "" : "pt-32 md:pt-24"}>
        <AppErrorBoundary key={pathname}>
          <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
        </AppErrorBoundary>
      </main>
      <Footer />
    </>
  );
}
