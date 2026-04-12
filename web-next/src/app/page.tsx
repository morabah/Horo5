import { HomePage } from "@/components/home-page";
import { fetchStorefrontCatalogServer, getStorefrontServerBaseUrl } from "@/lib/storefront-server";

export default async function Page() {
  const catalog = await fetchStorefrontCatalogServer().catch((error) => {
    console.error("[storefront] Failed to fetch home catalog", {
      baseUrl: getStorefrontServerBaseUrl(),
      error,
    });
    return null;
  });

  return <HomePage initialCatalog={catalog ?? undefined} />;
}
