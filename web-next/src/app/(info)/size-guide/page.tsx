import { fetchStorefrontSettingsServer } from "@/lib/storefront-server";
import { RouterContextProvider } from "@/lib/router-context";
import { mergePdpSizeTableConfig } from "@/storefront/data/domain-config";
import { SizeGuide } from "@/storefront/pages/SizeGuide";

export const revalidate = 86400;

export default async function Page() {
  const storefrontSettings = await fetchStorefrontSettingsServer();
  const sizeTableConfig = mergePdpSizeTableConfig(storefrontSettings ?? undefined);

  return (
    <RouterContextProvider>
      <SizeGuide sizeTableConfig={sizeTableConfig} />
    </RouterContextProvider>
  );
}
