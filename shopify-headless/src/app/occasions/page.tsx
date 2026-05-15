import type { Metadata } from "next";

import { CollectionCard } from "@/components/collection-card";
import { ProductCard } from "@/components/product-card";
import { siteUrl } from "@/lib/env";
import { getCollections, getProducts } from "@/lib/shopify/commerce";

export const metadata: Metadata = {
  title: "Shop by Occasion",
  alternates: { canonical: `${siteUrl}/occasions` },
};

export default async function OccasionsPage() {
  const [collections, products] = await Promise.all([
    getCollections(12).catch(() => []),
    getProducts(12).catch(() => []),
  ]);
  const occasionCollections = collections.filter((collection) => /occasion|gift|birthday|moment|eid|ramadan/i.test(`${collection.title} ${collection.handle}`));

  return (
    <main className="mx-auto w-full max-w-6xl space-y-10 px-4 py-10 md:px-8">
      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/50">Occasion route</p>
        <h1 className="text-4xl font-bold">Shop by Occasion</h1>
        <p className="max-w-2xl text-black/70">Pick a piece for birthdays, milestones, visits, or a gift without a reason.</p>
      </section>

      {occasionCollections.length > 0 ? (
        <section className="grid gap-4 md:grid-cols-3">
          {occasionCollections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </section>
      ) : (
        <section className="rounded-lg border border-dashed border-black/15 bg-white p-6 text-sm text-black/65">
          Add Shopify collections or metaobjects with occasion/gift naming to populate this route automatically.
        </section>
      )}

      <section className="space-y-5">
        <h2 className="text-2xl font-bold">Pieces for moments</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </main>
  );
}
