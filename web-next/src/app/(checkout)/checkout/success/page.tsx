"use client";

import { Suspense } from "react";
import { OrderConfirmation } from "@/storefront/pages/OrderConfirmation";
import { RouterContextProvider } from "@/lib/router-context";

export default function Page() {
  return (
    <RouterContextProvider>
      <Suspense fallback={null}>
        <OrderConfirmation />
      </Suspense>
    </RouterContextProvider>
  );
}
