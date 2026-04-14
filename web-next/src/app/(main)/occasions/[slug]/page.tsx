import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { OccasionCollectionPage } from "@/components/occasion-collection-page";
import { buildOccasionMetadata, fetchStorefrontOccasionServer } from "@/lib/storefront-server";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const occasion = await fetchStorefrontOccasionServer(slug).catch(() => null);

  if (!occasion) {
    return {
      title: "Occasion not found | HORO Egypt",
      robots: { index: false, follow: true },
    };
  }

  return buildOccasionMetadata(occasion);
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const occasion = await fetchStorefrontOccasionServer(slug).catch(() => null);

  if (!occasion) {
    notFound();
  }

  return <OccasionCollectionPage initialOccasion={occasion} initialSlug={slug} />;
}
