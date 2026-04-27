import { HomePage } from "@/components/home-page";
import {
  fetchStorefrontCatalogServer,
  fetchStorefrontHomepageServer,
  fetchStorefrontSettingsServer,
  logStorefrontFetchError,
} from "@/lib/storefront-server";

export default async function Page() {
  const [catalog, settings, homepage] = await Promise.all([
    fetchStorefrontCatalogServer().catch((error) => {
      logStorefrontFetchError("[storefront] Failed to fetch home catalog", error);
      return null;
    }),
    fetchStorefrontSettingsServer().catch((error) => {
      logStorefrontFetchError("[storefront] Failed to fetch home settings", error);
      return null;
    }),
    fetchStorefrontHomepageServer().catch((error) => {
      logStorefrontFetchError("[storefront] Failed to fetch homepage sections", error);
      return null;
    }),
  ]);

  return (
    <HomePage
      initialCatalog={catalog ?? undefined}
      homepageSections={homepage?.sections ?? null}
      sectionsEnabled={settings?.homepage?.sectionsEnabled ?? null}
    />
  );
}
