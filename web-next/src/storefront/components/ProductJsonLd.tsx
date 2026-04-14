import { Helmet } from "react-helmet-async";

import type { Product, RuntimeCatalog } from "../data/catalog-types";
import { buildProductJsonLdSchema } from "../seo/product-jsonld-schema";
import { getSiteUrl } from "../seo/siteUrl";

function jsonLdString(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

type Props = {
  product: Product;
  /** Medusa storefront catalog slice (same source as SSR). Omit only when unavailable. */
  catalog?: Pick<RuntimeCatalog, "feelings" | "occasions"> | null;
};

/**
 * Client-side JSON-LD for non-Next hosts (e.g. legacy SPA). Next.js PDP should inject JSON-LD
 * in `app/(main)/products/[slug]/page.tsx` only (`renderJsonLd={false}` on `ProductDetail`).
 */
export function ProductJsonLd({ product, catalog }: Props) {
  const siteUrl = getSiteUrl();
  const ld = buildProductJsonLdSchema(product, { siteOrigin: siteUrl, catalog });

  return (
    <Helmet>
      <script type="application/ld+json">{jsonLdString(ld)}</script>
    </Helmet>
  );
}
