"use client";

import { OrderConfirmation } from "../../../../../../web/src/pages/OrderConfirmation";
import { RouterContextProvider } from "@/lib/router-context";

export default function Page() {
  return (
    <RouterContextProvider>
      <OrderConfirmation />
    </RouterContextProvider>
  );
}
