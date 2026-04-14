import type { Metadata } from "next";

import { SearchPage } from "@/components/search-page";

const site = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") ?? "";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const raw = sp.q;
  const q = typeof raw === "string" ? raw.trim() : "";
  const title = q ? `Search: ${q} | HORO Egypt` : "Search | HORO Egypt";
  const description = q
    ? `Search results for “${q}” — graphic tees, feelings, and occasions at HORO Egypt.`
    : "Search designs, feelings, and occasions at HORO Egypt.";
  const canonical =
    site && q ? `${site}/search?q=${encodeURIComponent(q)}` : site ? `${site}/search` : undefined;

  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
    },
  };
}

export default function Page() {
  return <SearchPage />;
}
