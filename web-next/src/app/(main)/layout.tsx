import { OrganizationJsonLd } from "@/components/organization-jsonld";
import { StorefrontChrome } from "@/components/storefront-chrome";
import { fetchStorefrontCatalogServer, fetchStorefrontSettingsServer, logStorefrontFetchError } from "@/lib/storefront-server";
import { Providers } from "../providers";

export default async function MainStoreLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const renderedAt = new Date().toISOString();
  const [initialCatalog, settings] = await Promise.all([
    fetchStorefrontCatalogServer().catch((error) => {
      logStorefrontFetchError("[storefront] Failed to fetch initial catalog in layout", error);
      return null;
    }),
    fetchStorefrontSettingsServer().catch((error) => {
      logStorefrontFetchError("[storefront] Failed to fetch storefront settings in layout", error);
      return null;
    }),
  ]);

  return (
    <Providers initialCatalog={initialCatalog} renderedAt={renderedAt}>
      <OrganizationJsonLd />
      <StorefrontChrome navigation={settings?.navigation ?? null}>{children}</StorefrontChrome>
    </Providers>
  );
}
