import { HomePage } from "@/components/home-page";
import {
  fetchStorefrontCatalogServer,
  fetchStorefrontSettingsServer,
  logStorefrontFetchError,
} from "@/lib/storefront-server";

export default async function Page() {
  const [catalog, settings] = await Promise.all([
    fetchStorefrontCatalogServer().catch((error) => {
      logStorefrontFetchError("[storefront] Failed to fetch home catalog", error);
      return null;
    }),
    fetchStorefrontSettingsServer().catch((error) => {
      logStorefrontFetchError("[storefront] Failed to fetch home settings", error);
      return null;
    }),
  ]);

  return (
    <HomePage
      initialCatalog={catalog ?? undefined}
      sectionsEnabled={settings?.homepage?.sectionsEnabled ?? null}
    />
  );
}
