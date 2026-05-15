import type { Metadata } from "next";

import { PolicyPage } from "@/components/policy/policy-page";
import { siteUrl } from "@/lib/env";

export const metadata: Metadata = {
  title: "Terms",
  alternates: { canonical: `${siteUrl}/terms` },
};

export default function TermsPage() {
  return (
    <PolicyPage
      eyebrow="Policy"
      title="Terms of service"
      intro="Launch terms for the Shopify headless storefront. Production legal copy should be reviewed before scale."
      sections={[
        { title: "Product availability", body: "Products, sizes, prices, discounts, and delivery options depend on Shopify inventory and market configuration at checkout." },
        { title: "Orders", body: "An order is confirmed through Shopify checkout. COD orders may require WhatsApp confirmation before dispatch." },
        { title: "Policies", body: "Exchange, privacy, payment, and shipping rules should match the live Shopify store policy settings before launch." },
      ]}
    />
  );
}
