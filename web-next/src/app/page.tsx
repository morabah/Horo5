import { HomePage } from "@/components/home-page";
import { fetchStorefrontCatalogServer } from "@/lib/storefront-server";

export default async function Page() {
  const catalog = await fetchStorefrontCatalogServer().catch(() => null);

  return <HomePage initialProducts={catalog?.products} />;
}
