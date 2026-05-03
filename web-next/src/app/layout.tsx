import "./globals.css";
import { RootProviders } from "./root-providers";

// Root: minimal i18n so `not-found` and other root-only trees work. Catalog + full providers
// live in route-group layouts so `/checkout` can skip the heavy `/storefront/catalog` fetch.

/**
 * Preconnect targets resolved server-side from env. Cart and order calls go to Medusa
 * (Railway) via `/store/*` rewrites, so warming the TCP+TLS handshake here saves
 * ~100-250 ms on the first interaction (Add to cart / Checkout) on cold connections.
 */
function getMedusaPreconnectOrigin(): string | null {
  const raw = (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || process.env.MEDUSA_BACKEND_URL || "").trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return null;
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const medusaOrigin = getMedusaPreconnectOrigin();

  return (
    <html lang="en" className="h-full antialiased" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        {medusaOrigin ? (
          <>
            <link rel="preconnect" href={medusaOrigin} crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={medusaOrigin} />
          </>
        ) : null}
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <RootProviders>{children}</RootProviders>
      </body>
    </html>
  );
}
