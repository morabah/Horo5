import type { Metadata } from "next";

import { ShopByOccasionPage } from "@/components/shop-by-occasion-page";
import { fetchStorefrontCatalogServer, logStorefrontFetchError } from "@/lib/storefront-server";

const site = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") ?? "";

export const metadata: Metadata = {
  title: "Gifts | HORO Egypt",
  description:
    "Shop gift-ready HORO graphic tees by recipient and occasion, with COD and 14-day exchange in Egypt.",
  alternates: site ? { canonical: `${site}/gifts` } : undefined,
  openGraph: {
    title: "Gifts | HORO Egypt",
    description:
      "Shop gift-ready HORO graphic tees by recipient and occasion, with COD and 14-day exchange in Egypt.",
    url: site ? `${site}/gifts` : undefined,
    type: "website",
  },
};

export default async function Page() {
  const catalog = await fetchStorefrontCatalogServer().catch((error) => {
    logStorefrontFetchError("[storefront] Failed to fetch gifts catalog", error);
    return null;
  });
  const giftOccasions = (catalog?.occasions ?? [])
    .filter((occasion) => occasion.active !== false && occasion.isGiftOccasion)
    .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0))
    .slice(0, 4);

  return <ShopByOccasionPage initialOccasions={giftOccasions} mode="gifts" />;
}
