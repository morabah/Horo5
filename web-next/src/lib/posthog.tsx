"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { capturePostHogEvent, isPostHogConfigured } from "@/lib/posthog-client";

function PostHogPageview() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Only track if pathname is present and PostHog is loaded
    if (!pathname || typeof window === "undefined") return undefined;

    const timer = window.setTimeout(() => {
      let url = window.location.origin + pathname;
      if (searchParams && searchParams.toString()) {
        url = url + `?${searchParams.toString()}`;
      }
      capturePostHogEvent("$pageview", {
        $current_url: url,
        path: pathname,
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [pathname, searchParams]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  // If no env variable, skip wrapping to avoid errors
  if (!isPostHogConfigured()) {
    return <>{children}</>;
  }

  return (
    <>
      <Suspense fallback={null}>
        <PostHogPageview />
      </Suspense>
      {children}
    </>
  );
}
