import "./globals.css";
import { RootProviders } from "./root-providers";

// Root: minimal i18n so `not-found` and other root-only trees work. Catalog + full providers
// live in route-group layouts so `/checkout` can skip the heavy `/storefront/catalog` fetch.

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" data-scroll-behavior="smooth">
      <body className="min-h-full flex flex-col">
        <RootProviders>{children}</RootProviders>
      </body>
    </html>
  );
}
