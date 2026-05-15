import type { Metadata } from "next";

import { PolicyPage } from "@/components/policy/policy-page";
import { siteUrl } from "@/lib/env";

export const metadata: Metadata = {
  title: "FAQ",
  alternates: { canonical: `${siteUrl}/faq` },
};

export default function FaqPage() {
  return (
    <PolicyPage
      eyebrow="Quick answers"
      title="FAQ"
      intro="Short answers for the launch journey: product proof, COD, delivery, sizing, exchange, and gifts."
      sections={[
        { title: "What is HORO?", body: "HORO makes artist-made graphic tees for feelings, moments, and meaningful gifts." },
        { title: "Is COD available?", body: "Cash on Delivery can be selected in Shopify checkout when it is enabled for the Egypt market and the delivery area." },
        { title: "Can I ask before buying?", body: "Yes. Use WhatsApp for size help, gift fit, delivery questions, or exchange support." },
      ]}
    />
  );
}
