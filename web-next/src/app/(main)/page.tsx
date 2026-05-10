import { Suspense } from "react";
import { HomePage } from "@/components/home-page";
import {
  fetchStorefrontCatalogServer,
  fetchStorefrontHomepageServer,
  fetchStorefrontSettingsServer,
  logStorefrontFetchError,
} from "@/lib/storefront-server";
import { getPreLaunchPhase, type PreLaunchPhase } from "@/lib/pre-launch";
import { PreLaunchTeaseHero } from "@/storefront/components/PreLaunchTeaseHero";

export const revalidate = 60;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const phase = getPreLaunchPhase();

  // Dev-only: override phase via query param with secret token.
  // Set HORO_PREVIEW_SECRET in .env.local (any random string).
  // Usage: ?_horo_preview=live&_horo_secret=YOUR_SECRET
  const preview = params._horo_preview as string | undefined;
  const secret = params._horo_secret as string | undefined;
  const previewSecret = process.env.HORO_PREVIEW_SECRET;
  const effectivePhase: PreLaunchPhase =
    previewSecret &&
    secret === previewSecret &&
    (preview === "tease" || preview === "reveal" || preview === "launch" || preview === "live")
      ? preview
      : phase;

  if (effectivePhase === "tease") {
    return <PreLaunchTeaseHero />;
  }

  const [catalog, settings, homepage] = await Promise.all([
    fetchStorefrontCatalogServer().catch((error) => {
      logStorefrontFetchError("[storefront] Failed to fetch home catalog", error);
      return null;
    }),
    fetchStorefrontSettingsServer().catch((error) => {
      logStorefrontFetchError("[storefront] Failed to fetch home settings", error);
      return null;
    }),
    fetchStorefrontHomepageServer().catch((error) => {
      logStorefrontFetchError("[storefront] Failed to fetch homepage sections", error);
      return null;
    }),
  ]);

  return (
    <Suspense fallback={null}>
      <HomePage
        initialCatalog={catalog ?? undefined}
        homepageSections={homepage?.sections ?? null}
        sectionsEnabled={settings?.homepage?.sectionsEnabled ?? null}
      />
    </Suspense>
  );
}
