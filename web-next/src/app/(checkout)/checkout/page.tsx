import { Checkout } from "@/storefront/pages/Checkout";
import { RouterContextProvider } from "@/lib/router-context";
import { fetchStorefrontSettingsServer, logStorefrontFetchError } from "@/lib/storefront-server";

export default async function Page() {
  const settings = await fetchStorefrontSettingsServer().catch((error) => {
    logStorefrontFetchError("[storefront] Failed to fetch checkout settings", error);
    return null;
  });

  return (
    <RouterContextProvider>
      <Checkout checkoutSettings={settings?.checkout ?? null} />
    </RouterContextProvider>
  );
}
