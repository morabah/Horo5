import { HomePage } from "@/components/home-page";
import { fetchStorefrontCatalogServer, logStorefrontFetchError } from "@/lib/storefront-server";

export default async function Page() {
  const catalog = await fetchStorefrontCatalogServer().catch((error) => {
    logStorefrontFetchError("[storefront] Failed to fetch home catalog", error);
    return null;
  });

  return <HomePage initialCatalog={catalog ?? undefined} />;
}
