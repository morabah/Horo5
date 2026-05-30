import nextDynamic from "next/dynamic";
import { cookies } from "next/headers";
import { RouterContextProvider } from "@/lib/router-context";
import {
  fetchStorefrontCartServer,
  fetchStorefrontSettingsServer,
  logStorefrontFetchError,
} from "@/lib/storefront-server";
import { MEDUSA_CART_ID_COOKIE } from "@/storefront/cart/types";

export const dynamic = "force-dynamic";

const Checkout = nextDynamic(
  () => import("@/storefront/pages/Checkout").then((module) => module.Checkout),
  {
    loading: () => (
      <div className="mx-auto max-w-lg px-4 py-16 text-center font-body text-sm text-clay" role="status">
        Loading checkout…
      </div>
    ),
  },
);

export default async function Page() {
  const cookieStore = await cookies();
  const cartId = cookieStore.get(MEDUSA_CART_ID_COOKIE)?.value ?? null;
  const [settings, cart] = await Promise.all([
    fetchStorefrontSettingsServer().catch((error) => {
      logStorefrontFetchError("[storefront] Failed to fetch checkout settings", error);
      return null;
    }),
    cartId
      ? fetchStorefrontCartServer(cartId).catch((error) => {
          logStorefrontFetchError("[storefront] Failed to fetch checkout cart for server render", error, { cartId });
          return null;
        })
      : Promise.resolve(null),
  ]);
  const initialState = cart ? "cart" : cartId ? "unknown" : "empty";

  return (
    <RouterContextProvider>
      <Checkout
        checkoutSettings={settings?.checkout ?? null}
        initialCart={cart}
        initialCartId={cartId}
        initialState={initialState}
      />
    </RouterContextProvider>
  );
}
