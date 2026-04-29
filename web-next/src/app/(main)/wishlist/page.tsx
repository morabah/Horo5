import type { Metadata } from "next";
import { WishlistPage } from "@/components/wishlist-page";
import { fetchStorefrontCatalogServer, logStorefrontFetchError } from "@/lib/storefront-server";

const site = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") ?? "";

export const metadata: Metadata = {
  title: "Wishlist | HORO Egypt",
  description: "Your saved HORO pieces — original graphic tees you've set aside.",
  alternates: site ? { canonical: `${site}/wishlist` } : undefined,
  openGraph: {
    title: "Wishlist | HORO Egypt",
    description: "Your saved HORO pieces — original graphic tees you've set aside.",
    url: site ? `${site}/wishlist` : undefined,
    type: "website",
  },
};

export const revalidate = 60;

export default async function Page() {
  const catalog = await fetchStorefrontCatalogServer().catch((error) => {
    logStorefrontFetchError("[storefront] Failed to fetch catalog for wishlist page", error);
    return null;
  });

  return <WishlistPage initialCatalog={catalog} />;
}
