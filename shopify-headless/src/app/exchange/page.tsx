import type { Metadata } from "next";

import { PolicyPage } from "@/components/policy/policy-page";
import { siteUrl } from "@/lib/env";

export const metadata: Metadata = {
  title: "Exchange Policy",
  alternates: { canonical: `${siteUrl}/exchange` },
};

export default function ExchangePage() {
  return (
    <PolicyPage
      eyebrow="Customer care"
      title="14-day easy exchange"
      intro="HORO should feel low-risk before checkout and after delivery. This page mirrors the exchange promise used across the storefront."
      sections={[
        { title: "Window", body: "Exchange requests are accepted within 14 days of delivery when the product is unworn, clean, and in resale-ready condition." },
        { title: "Sizing", body: "If the fit is unclear before ordering, use WhatsApp size help. After delivery, exchange to an available size when stock allows." },
        { title: "How to start", body: "Send your order number, product name, size received, and requested size through WhatsApp or email so support can confirm availability." },
      ]}
    />
  );
}
