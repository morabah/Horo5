import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";

import { FeelingCollectionPage } from "@/components/feeling-collection-page";
import {
  buildFeelingMetadata,
  fetchStorefrontCatalogServer,
  logStorefrontFetchError,
} from "@/lib/storefront-server";
import { mapLegacyFeelingSlug } from "@/storefront/data/legacy-slugs";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const resolvedSlug = mapLegacyFeelingSlug(slug);
  const catalog = await fetchStorefrontCatalogServer().catch((error) => {
    logStorefrontFetchError("[storefront] Failed to fetch catalog for feeling metadata", error, { slug });
    return null;
  });
  const feeling = catalog?.feelings.find((item) => item.slug === resolvedSlug);

  if (!feeling) {
    return {
      title: "Feeling not found | HORO Egypt",
      robots: { index: false, follow: true },
    };
  }

  return buildFeelingMetadata(feeling);
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const resolvedSlug = mapLegacyFeelingSlug(slug);
  const catalog = await fetchStorefrontCatalogServer().catch((error) => {
    logStorefrontFetchError("[storefront] Failed to fetch catalog for feeling page", error, { slug });
    return null;
  });
  const feeling = catalog?.feelings.find((item) => item.slug === resolvedSlug);

  if (!catalog || !feeling) {
    notFound();
  }

  return (
    <Suspense fallback={null}>
      <FeelingCollectionPage
        initialCatalog={catalog}
        initialSlug={resolvedSlug}
        enableLineRedirect
      />
    </Suspense>
  );
}
