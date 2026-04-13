import "./globals.css";
import { StorefrontChrome } from "@/components/storefront-chrome";
import { fetchStorefrontCatalogServer, logStorefrontFetchError } from "@/lib/storefront-server";
import { Providers } from "./providers";

// Avoid force-dynamic here so the root shell can participate in Next fetch caching (catalog uses
// revalidate in storefront-server). Profile Medusa catalog timings with STOREFRONT_PROFILE_CATALOG=1.

export default async function RootLayout({
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
    <html lang="en" className="h-full antialiased" data-scroll-behavior="smooth">
      <body className="min-h-full flex flex-col">
        <Providers initialCatalog={initialCatalog} renderedAt={renderedAt}>
          <StorefrontChrome>{children}</StorefrontChrome>
        </Providers>
      </body>
    </html>
  );
}
