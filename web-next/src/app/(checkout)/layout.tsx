import { StorefrontChrome } from "@/components/storefront-chrome";
import { fetchStorefrontSettingsServer, logStorefrontFetchError } from "@/lib/storefront-server";
import { Providers } from "../providers";

/** Checkout: skip Medusa `/storefront/catalog` entirely (server + client). Cart/order data is independent. */
export default async function CheckoutShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const renderedAt = new Date().toISOString();
  const settings = await fetchStorefrontSettingsServer().catch((error) => {
    logStorefrontFetchError("[storefront] Failed to fetch checkout shell settings", error);
    return null;
  });

  return (
    <Providers initialCatalog={null} renderedAt={renderedAt} skipCatalogHydration>
      <StorefrontChrome navigation={settings?.navigation ?? null}>{children}</StorefrontChrome>
    </Providers>
  );
}
