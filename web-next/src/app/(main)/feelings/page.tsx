import type { Metadata } from "next";

import { ShopByFeelingPage } from "@/components/shop-by-feeling-page";
import { fetchStorefrontCatalogServer, logStorefrontFetchError } from "@/lib/storefront-server";

const site = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") ?? "";

export const metadata: Metadata = {
  title: "Shop by feeling | HORO Egypt",
  description:
    "Browse HORO graphic tees by feeling, then filter into the designs and lines that match the moment.",
  alternates: site ? { canonical: `${site}/feelings` } : undefined,
  openGraph: {
    title: "Shop by feeling | HORO Egypt",
    description:
      "Browse HORO graphic tees by feeling, then filter into the designs and lines that match the moment.",
    url: site ? `${site}/feelings` : undefined,
    type: "website",
  },
};

export default async function Page() {
  const catalog = await fetchStorefrontCatalogServer().catch((error) => {
    logStorefrontFetchError("[storefront] Failed to fetch feelings catalog", error);
    return null;
  });

  return <ShopByFeelingPage initialCatalog={catalog} />;
}
