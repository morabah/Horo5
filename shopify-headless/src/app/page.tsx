import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { CollectionCard } from "@/components/collection-card";
import { ProductCard } from "@/components/product-card";
import { TrustRibbon } from "@/components/trust-ribbon";
import { siteUrl } from "@/lib/env";
import { getCollections, getProducts } from "@/lib/shopify/commerce";

export const metadata: Metadata = {
  alternates: {
    canonical: `${siteUrl}/`,
  },
};

export default async function Home() {
  let collections: Awaited<ReturnType<typeof getCollections>> = [];
  let products: Awaited<ReturnType<typeof getProducts>> = [];
  try {
    [collections, products] = await Promise.all([getCollections(3), getProducts(8)]);
  } catch {
    collections = [];
    products = [];
  }
  const heroProduct = products.find((product) => product.featuredImage || product.images[0]);
  const heroImage = heroProduct?.featuredImage ?? heroProduct?.images[0] ?? null;

  return (
    <main className="mx-auto w-full max-w-6xl space-y-14 px-4 py-10 md:px-8 md:py-14">
      <section className="grid overflow-hidden rounded-lg border border-black/10 bg-[#111312] text-white md:grid-cols-[minmax(0,1fr)_minmax(18rem,28rem)]">
        <div className="flex flex-col justify-end px-6 py-12 md:px-10 md:py-14">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">HORO | هورو</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-bold leading-tight md:text-5xl">
            Wear what you feel.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/76">
            Artist-made tees for feelings, moments, and meaningful gifts. Printed in Egypt with COD and exchange reassurance.
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70" dir="rtl">
            تيشيرتات برسومات فنانين، للهدية أو الشعور أو اللحظة اللي تستاهل معنى.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/products" className="inline-flex min-h-12 items-center rounded-md bg-white px-5 text-sm font-semibold text-black transition hover:bg-white/90">
              Shop the Drop
            </Link>
            <Link href="/feelings" className="inline-flex min-h-12 items-center rounded-md border border-white/35 px-5 text-sm font-semibold text-white transition hover:bg-white/10">
              Shop by Feeling
            </Link>
            <Link href="/gifts" className="inline-flex min-h-12 items-center rounded-md border border-white/35 px-5 text-sm font-semibold text-white transition hover:bg-white/10">
              Shop Gifts
            </Link>
          </div>
        </div>
        <div className="relative min-h-[22rem] bg-black/20 md:min-h-[34rem]">
          {heroImage ? (
            <Image
              src={heroImage.url}
              alt={heroImage.altText ?? heroProduct?.title ?? "HORO artist-made T-shirt"}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 40vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-8 text-center text-sm text-white/60">
              Add Shopify product media to populate the launch hero.
            </div>
          )}
        </div>
      </section>

      <TrustRibbon />

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { title: "Shop by Feeling", body: "Start from the mood and choose the piece that matches it.", href: "/feelings" },
          { title: "Shop by Occasion", body: "Find a piece for birthdays, milestones, and everyday moments.", href: "/occasions" },
          { title: "Shop Gifts", body: "Pick by recipient, meaning, and size-help confidence.", href: "/gifts" },
        ].map((route) => (
          <Link key={route.href} href={route.href} className="rounded-lg border border-black/10 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-sm">
            <h2 className="text-xl font-bold">{route.title}</h2>
            <p className="mt-2 text-sm leading-6 text-black/65">{route.body}</p>
          </Link>
        ))}
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
