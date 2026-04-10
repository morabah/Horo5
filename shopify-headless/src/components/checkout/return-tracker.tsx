"use client";

import { useEffect } from "react";

import { trackEvent } from "@/lib/analytics/events";

type ReturnTrackerProps = {
  status: "success" | "failed" | "cancelled";
};

export function ReturnTracker({ status }: ReturnTrackerProps) {
  useEffect(() => {
    trackEvent({
      event: "checkout_return",
      checkout_status: status,
      purchase_state: status === "success" ? "unverified" : "not_completed",
    });
  }, [status]);

  return null;
}
