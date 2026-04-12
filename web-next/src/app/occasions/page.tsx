import type { Metadata } from "next";

import { ShopByOccasionPage } from "@/components/shop-by-occasion-page";
import { fetchStorefrontCatalogServer, getStorefrontServerBaseUrl } from "@/lib/storefront-server";

const site = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") ?? "";

export const metadata: Metadata = {
  title: "Shop by moment | HORO Egypt",
  description:
    "Browse HORO graphic tees by occasion — gifts, milestones, and everyday streetwear with COD and exchange in Egypt.",
  alternates: site ? { canonical: `${site}/occasions` } : undefined,
  openGraph: {
    title: "Shop by moment | HORO Egypt",
    description:
      "Browse HORO graphic tees by occasion — gifts, milestones, and everyday streetwear with COD and exchange in Egypt.",
    url: site ? `${site}/occasions` : undefined,
    type: "website",
  },
};

export default async function Page() {
  const catalog = await fetchStorefrontCatalogServer().catch((error) => {
    console.error("[storefront] Failed to fetch occasions catalog", {
      baseUrl: getStorefrontServerBaseUrl(),
      error,
    });
    return null;
  });

  return <ShopByOccasionPage initialOccasions={catalog?.occasions} />;
}
