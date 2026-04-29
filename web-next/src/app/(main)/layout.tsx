import { OrganizationJsonLd } from "@/components/organization-jsonld";
import { StorefrontChrome } from "@/components/storefront-chrome";
import { fetchStorefrontSettingsServer, logStorefrontFetchError } from "@/lib/storefront-server";
import { Providers } from "../providers";

export default async function MainStoreLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const renderedAt = new Date().toISOString();
  const settings = await fetchStorefrontSettingsServer().catch((error) => {
    logStorefrontFetchError("[storefront] Failed to fetch storefront settings in layout", error);
    return null;
  });

  return (
    <Providers initialCatalog={null} renderedAt={renderedAt} skipCatalogHydration>
      <OrganizationJsonLd />
      <StorefrontChrome navigation={settings?.navigation ?? null}>{children}</StorefrontChrome>
    </Providers>
  );
}
