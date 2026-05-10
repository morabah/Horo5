import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CampaignPage } from "@/storefront/pages/CampaignPage";
import { fetchStorefrontMerchEventServer, logStorefrontFetchError } from "@/lib/storefront-server";
import { getPreLaunchPhase } from "@/lib/pre-launch";

type CampaignPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: CampaignPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchStorefrontMerchEventServer(slug).catch((error) => {
    logStorefrontFetchError("[storefront] Failed to fetch campaign metadata", error, { slug });
    return null;
  });

  const event = data?.event;
  if (!event) {
    return {
      title: "Page not found | HORO Egypt",
      robots: { index: false, follow: true },
    };
  }

  return {
    title: event.seoTitle || `${event.name} | HORO Egypt`,
    description: event.seoDescription || event.teaser,
  };
}

export default async function Page({ params }: CampaignPageProps) {
  const phase = getPreLaunchPhase();
  const { slug } = await params;

  const data = await fetchStorefrontMerchEventServer(slug).catch((error) => {
    logStorefrontFetchError("[storefront] Failed to fetch campaign page", error, { slug });
    return null;
  });

  if (!data?.event) {
    notFound();
  }

  return (
    <CampaignPage
      event={data.event}
      products={data.products}
      preLaunchPhase={phase}
    />
  );
}
