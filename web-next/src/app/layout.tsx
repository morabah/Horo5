import "./globals.css";
import { StorefrontChrome } from "@/components/storefront-chrome";
import { fetchStorefrontCatalogServer, getStorefrontServerBaseUrl } from "@/lib/storefront-server";
import { Providers } from "./providers";

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
    console.error("[storefront] Failed to fetch initial catalog in layout", {
      baseUrl: getStorefrontServerBaseUrl(),
      error,
    });
    initialCatalog = null;
  }

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Providers initialCatalog={initialCatalog} renderedAt={renderedAt}>
          <StorefrontChrome>{children}</StorefrontChrome>
        </Providers>
      </body>
    </html>
  );
}
