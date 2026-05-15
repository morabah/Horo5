import type { Metadata } from "next";

import { PolicyPage } from "@/components/policy/policy-page";
import { siteUrl } from "@/lib/env";

export const metadata: Metadata = {
  title: "Privacy Policy",
  alternates: { canonical: `${siteUrl}/privacy` },
};

export default function PrivacyPage() {
  return (
    <PolicyPage
      eyebrow="Policy"
      title="Privacy policy"
      intro="This pilot storefront only asks for the data needed to run Shopify checkout, support, delivery, analytics, and post-purchase service."
      sections={[
        { title: "Checkout data", body: "Shopify processes checkout, payment, shipping, and order data according to the configured Shopify store policies." },
        { title: "Support data", body: "If you contact HORO on WhatsApp, support uses the conversation to answer the request, confirm orders, and improve service quality." },
        { title: "Analytics", body: "Analytics events may measure product views, add-to-cart, checkout, and purchase flow health without storing sensitive payment details in this app." },
      ]}
    />
  );
}
