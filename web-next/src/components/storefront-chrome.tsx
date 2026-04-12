"use client";

import type { ReactNode } from "react";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { AppErrorBoundary } from "../../../web/src/components/AppErrorBoundary";
import { FunnelNavigationTracker } from "../../../web/src/components/FunnelNavigationTracker";
import { Nav } from "../../../web/src/components/Nav";
import { Footer } from "../../../web/src/components/Footer";

/**
 * Same chrome as `web/src/components/Layout.tsx` but uses page `children` instead of
 * `<Outlet />` (the Next.js react-router shim does not implement Outlet).
 */
export function StorefrontChrome({ children }: { children: ReactNode }) {
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
      <Suspense fallback={null}>
        <FunnelNavigationTracker />
        <Nav />
      </Suspense>
      <main id="main-content" className={isHome ? "" : "pt-32 md:pt-24"}>
        <AppErrorBoundary key={pathname}>
          <Suspense fallback={null}>{children}</Suspense>
        </AppErrorBoundary>
      </main>
      <Footer />
    </>
  );
}
