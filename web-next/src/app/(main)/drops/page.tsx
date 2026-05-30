import type { Metadata } from 'next';

import { fetchStorefrontCatalogServer, logStorefrontFetchError } from '@/lib/storefront-server';
import { DropsHubPage } from '@/storefront/pages/DropsHubPage';

export const metadata: Metadata = {
  title: 'New drops | HORO Egypt',
  description: 'Limited artist-made HORO drops and collections.',
};

export default async function Page() {
  const catalog = await fetchStorefrontCatalogServer().catch((error) => {
    logStorefrontFetchError('[storefront] Failed to fetch drops hub', error);
    return null;
  });

  return <DropsHubPage events={catalog?.events ?? []} />;
}
