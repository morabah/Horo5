"use client";

import { OrderConfirmation } from "@/storefront/pages/OrderConfirmation";
import { RouterContextProvider } from "@/lib/router-context";

export default function Page() {
  return (
    <RouterContextProvider>
      <OrderConfirmation />
    </RouterContextProvider>
  );
}
