"use client";

import { useEffect } from "react";

import { trackEvent } from "@/lib/analytics/events";

type ProductViewTrackerProps = {
  productId: string;
  handle: string;
  title: string;
  amount: string;
  currencyCode: string;
};

export function ProductViewTracker(props: ProductViewTrackerProps) {
  useEffect(() => {
    trackEvent({
      event: "view_product",
      product_id: props.productId,
      product_handle: props.handle,
      product_title: props.title,
      amount: props.amount,
      currency: props.currencyCode,
    });
  }, [props.amount, props.currencyCode, props.handle, props.productId, props.title]);

  return null;
}
