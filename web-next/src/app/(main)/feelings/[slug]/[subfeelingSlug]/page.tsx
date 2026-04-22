import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FeelingCollectionPage } from "@/components/feeling-collection-page";
import {
  buildFeelingMetadata,
  fetchStorefrontCatalogServer,
  logStorefrontFetchError,
} from "@/lib/storefront-server";
import { mapLegacyFeelingSlug } from "@/storefront/data/legacy-slugs";

type PageProps = {
  params: Promise<{ slug: string; subfeelingSlug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, subfeelingSlug } = await params;
  const resolvedSlug = mapLegacyFeelingSlug(slug);
  const catalog = await fetchStorefrontCatalogServer().catch((error) => {
    logStorefrontFetchError("[storefront] Failed to fetch catalog for subfeeling metadata", error, {
      slug,
      subfeelingSlug,
    });
    return null;
  });
  const feeling = catalog?.feelings.find((item) => item.slug === resolvedSlug);
  const subfeeling = catalog?.subfeelings.find(
    (item) => item.feelingSlug === resolvedSlug && item.slug === subfeelingSlug,
  );

  if (!feeling || !subfeeling) {
    return {
      title: "Feeling line not found | HORO Egypt",
      robots: { index: false, follow: true },
    };
  }

  return buildFeelingMetadata(feeling, subfeeling);
}

export default async function Page({ params }: PageProps) {
  const { slug, subfeelingSlug } = await params;
  const resolvedSlug = mapLegacyFeelingSlug(slug);
  const catalog = await fetchStorefrontCatalogServer().catch((error) => {
    logStorefrontFetchError("[storefront] Failed to fetch catalog for subfeeling page", error, {
      slug,
      subfeelingSlug,
    });
    return null;
  });
  const feeling = catalog?.feelings.find((item) => item.slug === resolvedSlug);
  const subfeeling = catalog?.subfeelings.find(
    (item) => item.feelingSlug === resolvedSlug && item.slug === subfeelingSlug,
  );

  if (!catalog || !feeling || !subfeeling) {
    notFound();
  }

  return (
    <FeelingCollectionPage
      initialCatalog={catalog}
      initialSlug={resolvedSlug}
      initialSubfeelingSlug={subfeelingSlug}
    />
  );
}
