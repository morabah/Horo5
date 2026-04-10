import type { Metadata } from "next";

import { CollectionCard } from "@/components/collection-card";
import { ProductCard } from "@/components/product-card";
import { siteUrl } from "@/lib/env";
import { getCollections, getProducts } from "@/lib/shopify/commerce";

export const metadata: Metadata = {
  alternates: {
    canonical: `${siteUrl}/`,
  },
};

export default async function Home() {
  const [collections, products] = await Promise.all([getCollections(3), getProducts(8)]);

  return (
    <main className="mx-auto w-full max-w-6xl space-y-14 px-4 py-10 md:px-8 md:py-14">
      <section className="rounded-3xl bg-[#0F0F12] px-6 py-14 text-white md:px-10">
        <p className="text-xs uppercase tracking-[0.2em] text-white/60">HORO Storefront</p>
        <h1 className="mt-3 max-w-2xl text-4xl font-bold leading-tight md:text-5xl">
          Inject your custom design and keep Shopify for catalog, cart, and checkout.
        </h1>
        <p className="mt-4 max-w-2xl text-sm text-white/70 md:text-base">
          This starter storefront is headless-ready and structured for AI-assisted iteration.
        </p>
      </section>

      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Collections</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {collections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Latest Products</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </main>
  );
}
