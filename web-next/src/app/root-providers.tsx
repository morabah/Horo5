"use client";

import type { PropsWithChildren } from "react";
import { UiLocaleProvider, type UiLocale } from "@/storefront/i18n/ui-locale";
import { PostHogProvider } from "@/lib/posthog";

/**
 * Wraps the entire app so root-level routes (e.g. `not-found.tsx`) have i18n context.
 * Route-group layouts still mount full `Providers` + `AppProviders` (nested `UiLocaleProvider` is harmless).
 */
export function RootProviders({
  children,
  initialLocale = "en",
}: PropsWithChildren<{ initialLocale?: UiLocale }>) {
  return (
    <PostHogProvider>
      <UiLocaleProvider initialLocale={initialLocale}>{children}</UiLocaleProvider>
    </PostHogProvider>
  );
}
