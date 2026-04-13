import type { Metadata } from "next";

import { SearchPage } from "@/components/search-page";

const site = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") ?? "";

export const metadata: Metadata = {
  title: "Shop All | HORO Egypt",
  description: "Browse every HORO graphic tee in one place, with direct filters for price, size, and feeling.",
  alternates: site ? { canonical: `${site}/products` } : undefined,
  openGraph: {
    title: "Shop All | HORO Egypt",
    description: "Browse every HORO graphic tee in one place, with direct filters for price, size, and feeling.",
    url: site ? `${site}/products` : undefined,
    type: "website",
  },
};

export default function Page() {
  return <SearchPage />;
}
