import type { Metadata } from "next";

import { PolicyPage } from "@/components/policy/policy-page";
import { siteUrl } from "@/lib/env";

export const metadata: Metadata = {
  title: "Size Guide",
  alternates: { canonical: `${siteUrl}/size-guide` },
};

export default function SizeGuidePage() {
  return (
    <PolicyPage
      eyebrow="Fit confidence"
      title="Size guide"
      intro="Use the PDP fit note first, then confirm by WhatsApp if the tee is a gift or the buyer is between sizes."
      sections={[
        { title: "Default advice", body: "Most buyers should start with their usual relaxed T-shirt size. If you prefer a tighter fit, compare the product fit note before choosing." },
        { title: "Gift sizing", body: "When buying for someone else, share their usual brand/size and height if available. HORO support can suggest the safest size before checkout." },
        { title: "Measurement proof", body: "Product pages should show fit notes, model context, and proof media whenever Shopify metafields and media alt tags are populated." },
      ]}
    />
  );
}
