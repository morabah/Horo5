import { cookies } from "next/headers";
import { Cart } from "@/storefront/pages/Cart";
import { RouterContextProvider } from "@/lib/router-context";
import { fetchStorefrontCartServer, logStorefrontFetchError } from "@/lib/storefront-server";
import { getCartGiftWrapEgp, toCartLines } from "@/storefront/lib/medusa/adapters";
import { MEDUSA_CART_ID_COOKIE } from "@/storefront/cart/types";

export const dynamic = "force-dynamic";

export default async function Page() {
  const cookieStore = await cookies();
  const cartId = cookieStore.get(MEDUSA_CART_ID_COOKIE)?.value ?? null;
  const cart = cartId
    ? await fetchStorefrontCartServer(cartId).catch((error) => {
        logStorefrontFetchError("[storefront] Failed to fetch cart for server render", error, { cartId });
        return null;
      })
    : null;
  const initialState = cart ? "cart" : cartId ? "unknown" : "empty";

  return (
    <RouterContextProvider>
      <Cart
        initialCart={cart}
        initialLines={cart ? toCartLines(cart) : []}
        initialGiftWrapEgp={cart ? getCartGiftWrapEgp(cart) : 0}
        initialState={initialState}
      />
    </RouterContextProvider>
  );
}
