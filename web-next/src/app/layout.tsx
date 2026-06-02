import { cookies } from "next/headers";
import type { Metadata } from "next";

import "./globals.css";
import { RootProviders } from "./root-providers";
import type { UiLocale } from "@/storefront/i18n/ui-locale";
import { UI_LOCALE_COOKIE_KEY } from "@/storefront/i18n/ui-locale";

export const metadata: Metadata = {
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const medusaOrigin = getMedusaPreconnectOrigin();
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(UI_LOCALE_COOKIE_KEY)?.value;
  const initialLocale: UiLocale = cookieLocale === "ar" ? "ar" : "en";
  const htmlDir = initialLocale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={initialLocale} dir={htmlDir} className="h-full antialiased" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap"
        />
        {medusaOrigin ? (
          <>
            <link rel="preconnect" href={medusaOrigin} crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={medusaOrigin} />
          </>
        ) : null}
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <RootProviders initialLocale={initialLocale}>{children}</RootProviders>
      </body>
    </html>
  );
}
