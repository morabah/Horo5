"use client";

import type { PropsWithChildren } from "react";
import { UiLocaleProvider } from "@/storefront/i18n/ui-locale";
import { PostHogProvider } from "@/lib/posthog";

/**
 * Wraps the entire app so root-level routes (e.g. `not-found.tsx`) have i18n context.
 * Route-group layouts still mount full `Providers` + `AppProviders` (nested `UiLocaleProvider` is harmless).
 */
export function RootProviders({ children }: PropsWithChildren) {
  return (
    <PostHogProvider>
      <UiLocaleProvider>{children}</UiLocaleProvider>
    </PostHogProvider>
  );
}
