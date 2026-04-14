import { StorefrontChrome } from "@/components/storefront-chrome";
import { fetchStorefrontCatalogServer, logStorefrontFetchError } from "@/lib/storefront-server";
import { Providers } from "../providers";

export default async function MainStoreLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const renderedAt = new Date().toISOString();
  let initialCatalog = null;

  try {
    initialCatalog = await fetchStorefrontCatalogServer();
  } catch (error) {
    logStorefrontFetchError("[storefront] Failed to fetch initial catalog in layout", error);
    initialCatalog = null;
  }

  return (
    <Providers initialCatalog={initialCatalog} renderedAt={renderedAt}>
      <StorefrontChrome>{children}</StorefrontChrome>
    </Providers>
  );
}
