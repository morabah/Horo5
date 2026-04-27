import type { Metadata } from "next";

import { ShopAllPage } from "@/components/shop-all-page";
import { fetchStorefrontSettingsServer, logStorefrontFetchError } from "@/lib/storefront-server";

const site = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") ?? "";

export const metadata: Metadata = {
  title: "Shop All | HORO Egypt",
  description: "Browse every HORO graphic tee in one place with a clean product grid first, then refine by feeling, size, price, or occasion.",
  alternates: site ? { canonical: `${site}/products` } : undefined,
  openGraph: {
    title: "Shop All | HORO Egypt",
    description: "Browse every HORO graphic tee in one place with a clean product grid first, then refine by feeling, size, price, or occasion.",
    url: site ? `${site}/products` : undefined,
    type: "website",
  },
};

export default async function Page() {
  const settings = await fetchStorefrontSettingsServer().catch((error) => {
    logStorefrontFetchError("[storefront] Failed to fetch shop settings", error);
    return null;
  });

  return <ShopAllPage priceBands={settings?.search?.priceBands ?? null} />;
}
