import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArtistHubPage } from "@/components/artist-hub-page";
import { fetchStorefrontCatalogServer, logStorefrontFetchError } from "@/lib/storefront-server";

type ArtistPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ArtistPageProps): Promise<Metadata> {
  const { slug } = await params;
  const catalog = await fetchStorefrontCatalogServer().catch(() => null);
  const artist = catalog?.artists.find((entry) => entry.slug === slug);
  if (!artist) return { title: "Artist | HORO Egypt", robots: { index: false, follow: true } };
  return {
    title: `${artist.name} | HORO Egypt`,
    description: artist.style || `Shop HORO Egypt graphic tees illustrated by ${artist.name}.`,
  };
}

export default async function Page({ params }: ArtistPageProps) {
  const { slug } = await params;
  const catalog = await fetchStorefrontCatalogServer().catch((error) => {
    logStorefrontFetchError("[storefront] Failed to fetch artist catalog", error, { slug });
    return null;
  });
  const artist = catalog?.artists.find((entry) => entry.slug === slug && entry.active !== false);
  if (!artist) notFound();
  const products = (catalog?.products ?? []).filter((product) => product.artistSlug === slug);

  return <ArtistHubPage artist={artist} products={products} />;
}
