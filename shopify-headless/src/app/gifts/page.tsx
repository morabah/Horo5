import type { Metadata } from "next";

import { ProductCard } from "@/components/product-card";
import { siteUrl } from "@/lib/env";
import { getProducts } from "@/lib/shopify/commerce";
import type { ShopifyMetafield, ShopifyProduct } from "@/lib/shopify/types";

export const metadata: Metadata = {
  title: "Gifts that feel personal | HORO",
  description: "Artist-made T-shirts for people, moments, and feelings, with size help before ordering.",
  alternates: {
    canonical: `${siteUrl}/gifts`,
  },
};

function metafield(fields: ShopifyMetafield[], key: string): string | undefined {
  return fields.find((field) => field.namespace === "custom" && field.key === key)?.value || undefined;
}

function metafieldBoolean(fields: ShopifyMetafield[], key: string): boolean {
  const value = metafield(fields, key)?.trim().toLowerCase();
  return value === "true" || value === "1" || value === "yes";
}

function metafieldList(fields: ShopifyMetafield[], key: string): string[] {
  const value = metafield(fields, key);
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) return parsed.map(String).map((item) => item.trim()).filter(Boolean);
  } catch {
    // Shopify list metafields may arrive as plain text from older definitions.
  }
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function isGiftReady(product: ShopifyProduct): boolean {
  return metafieldBoolean(product.metafields, "giftable") || metafieldList(product.metafields, "gift_occasion_tags").length > 0;
}

export default async function GiftsPage() {
  let products: Awaited<ReturnType<typeof getProducts>> = [];
  try {
    products = await getProducts(48);
  } catch {
    products = [];
  }
  const giftProducts = products.filter(isGiftReady);

  return (
    <main className="mx-auto w-full max-w-6xl space-y-10 px-4 py-10 md:px-8">
      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/50">Gift route</p>
        <h1 className="text-4xl font-bold">Gifts that feel personal</h1>
        <p className="max-w-2xl text-black/70">Artist-made T-shirts for people, moments, and feelings.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {["Gift by Feeling", "Gift by Occasion", "Size help through WhatsApp", "Delivery and exchange reassurance"].map((title) => (
          <div key={title} className="rounded-2xl border border-black/10 p-5">
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-black/65">
              {title === "Size help through WhatsApp"
                ? "Ask before ordering when you are unsure about the recipient's size."
                : title === "Delivery and exchange reassurance"
                  ? "Use the checkout delivery promise and exchange policy before committing."
                  : "Use Shopify product metafields to tag real gift-ready products for this route."}
            </p>
          </div>
        ))}
      </section>

      <section className="space-y-5">
        <h2 className="text-2xl font-bold">Gift-ready products</h2>
        {giftProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {giftProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-black/15 p-6 text-sm text-black/65">
            No Shopify products are marked giftable yet. Set <code>custom.giftable</code> or <code>custom.gift_occasion_tags</code> to populate this section.
          </div>
        )}
      </section>
    </main>
  );
}
