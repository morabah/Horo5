import type { Metadata } from "next";

import { AnalyticsTracker } from "@/components/analytics/tracker";
import { CartProvider } from "@/components/cart/cart-provider";
import { StoreFooter } from "@/components/store-footer";
import { StoreHeader } from "@/components/store-header";
import { env, siteUrl } from "@/lib/env";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "HORO | Shopify Headless Storefront",
    template: "%s | HORO",
  },
  description: "Custom-designed storefront powered by Shopify headless APIs.",
  openGraph: {
    title: "HORO | Shopify Headless Storefront",
    description: "Custom-designed storefront powered by Shopify headless APIs.",
    url: siteUrl,
    siteName: "HORO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HORO | Shopify Headless Storefront",
    description: "Custom-designed storefront powered by Shopify headless APIs.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-[#FAFAF9] text-[#101012]">
        <AnalyticsTracker
          gaMeasurementId={env.NEXT_PUBLIC_GA_MEASUREMENT_ID}
          gtmId={env.NEXT_PUBLIC_GTM_ID}
          metaPixelId={env.NEXT_PUBLIC_META_PIXEL_ID}
        />
        <CartProvider>
          <StoreHeader />
          <div className="flex-1">{children}</div>
          <StoreFooter />
        </CartProvider>
      </body>
    </html>
  );
}
