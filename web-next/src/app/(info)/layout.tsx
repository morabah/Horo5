import { OrganizationJsonLd } from "@/components/organization-jsonld";
import { StorefrontChrome } from "@/components/storefront-chrome";
import { fetchStorefrontSettingsServer, logStorefrontFetchError } from "@/lib/storefront-server";
import { Providers } from "../providers";

/**
 * Lightweight layout for policy / info pages that do not need the product catalog.
 * Only fetches storefront settings (for navigation chrome), skipping the heavy
 * catalog fetch that (main)/layout.tsx performs.
 */
export default async function InfoLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const renderedAt = new Date().toISOString();
  const settings = await fetchStorefrontSettingsServer().catch((error) => {
    logStorefrontFetchError("[storefront] Failed to fetch settings in info layout", error);
    return null;
  });

  return (
    <Providers initialCatalog={null} renderedAt={renderedAt} skipCatalogHydration>
      <OrganizationJsonLd />
      <StorefrontChrome navigation={settings?.navigation ?? null}>{children}</StorefrontChrome>
    </Providers>
  );
}
