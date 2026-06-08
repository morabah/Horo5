import { OrganizationJsonLd } from "@/components/organization-jsonld";
import { StorefrontChrome } from "@/components/storefront-chrome";
import { fetchStorefrontIncentivesServer, fetchStorefrontSettingsServer, logStorefrontFetchError } from "@/lib/storefront-server";
import { getPreLaunchPhase, getLaunchAt } from "@/lib/pre-launch";
import { Providers } from "../providers";

export default async function MainStoreLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const renderedAt = new Date().toISOString();
  const [settings, incentives] = await Promise.all([
    fetchStorefrontSettingsServer().catch((error) => {
      logStorefrontFetchError("[storefront] Failed to fetch storefront settings in layout", error);
      return null;
    }),
    fetchStorefrontIncentivesServer().catch((error) => {
      logStorefrontFetchError("[storefront] Failed to fetch storefront incentives in layout", error);
      return null;
    }),
  ]);

  const phase = getPreLaunchPhase();
  const launchAt = phase === "launch" ? getLaunchAt()?.toISOString() ?? null : null;

  return (
    <Providers initialCatalog={null} renderedAt={renderedAt} skipCatalogHydration>
      <OrganizationJsonLd />
      <StorefrontChrome navigation={settings?.navigation ?? null} launchAt={launchAt} timedOffer={incentives?.timedOffer ?? null}>
        {children}
      </StorefrontChrome>
    </Providers>
  );
}
