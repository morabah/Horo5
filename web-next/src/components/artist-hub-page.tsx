"use client";

import { RouterContextProvider } from "@/lib/router-context";
import { MerchProductCard } from "@/storefront/components/MerchProductCard";
import { PageBreadcrumb } from "@/storefront/components/PageBreadcrumb";
import { ProductQuickView } from "@/storefront/components/ProductQuickView";
import { getProductCardImageSrc } from "@/storefront/data/images";
import type { Artist, Product } from "@/storefront/data/site";
import { useUiLocale } from "@/storefront/i18n/ui-locale";
import { useState } from "react";

function ArtistHub({ artist, products }: { artist: Artist; products: Product[] }) {
  const { copy, locale } = useUiLocale();
  const [quickViewSlug, setQuickViewSlug] = useState<string | null>(null);
  const isArabic = locale === "ar";

  return (
    <div className="bg-papyrus pb-16 md:pb-20">
      <div className="mx-auto max-w-7xl px-4 pt-8 md:px-8 md:pt-10">
        <PageBreadcrumb
          className="mb-6"
          items={[
            { label: copy.shell.home, to: "/" },
            { label: isArabic ? "الفنانون" : "Artists", to: "/artists" },
            { label: artist.name },
          ]}
        />
        <section className="border-b border-stone/25 pb-8">
          <p className="font-label text-[10px] font-medium uppercase tracking-[0.22em] text-label">
            {isArabic ? "فنان HORO" : "HORO artist"}
          </p>
          <h1 className="font-headline mt-2 text-[clamp(2rem,4vw,3rem)] font-semibold tracking-tight text-obsidian">
            {artist.name}
          </h1>
          {artist.style ? (
            <p className="mt-3 max-w-2xl font-body text-[1rem] leading-relaxed text-warm-charcoal">
              {artist.style}
            </p>
          ) : null}
        </section>
        <section className="pt-8" aria-labelledby="artist-products-title">
          <h2 id="artist-products-title" className="sr-only">
            {isArabic ? "تصاميم الفنان" : "Artist designs"}
          </h2>
          {products.length > 0 ? (
            <div className="vibe-product-grid">
              {products.map((product) => (
                <MerchProductCard
                  key={product.slug}
                  slug={product.slug}
                  name={product.name}
                  compareAtPriceEgp={product.originalPriceEgp ?? undefined}
                  priceEgp={product.priceEgp}
                  imageSrc={getProductCardImageSrc(product)}
                  imageAlt={`HORO ${product.name} graphic tee by ${artist.name}.`}
                  promoLabel={product.promoLabel}
                  promoEndsAt={product.promoEndsAt}
                  promoShowCountdown={product.promoShowCountdown}
                  eyebrow={product.fitLabel}
                  artistCredit={`Illustrated by ${artist.name}`}
                  onQuickView={setQuickViewSlug}
                />
              ))}
            </div>
          ) : (
            <p className="font-body text-warm-charcoal">
              {isArabic ? "لا توجد تصاميم منشورة لهذا الفنان حالياً." : "No published designs for this artist yet."}
            </p>
          )}
        </section>
      </div>
      {quickViewSlug ? (
        <ProductQuickView open productSlug={quickViewSlug} onClose={() => setQuickViewSlug(null)} />
      ) : null}
    </div>
  );
}

export function ArtistHubPage({ artist, products }: { artist: Artist; products: Product[] }) {
  return (
    <RouterContextProvider>
      <ArtistHub artist={artist} products={products} />
    </RouterContextProvider>
  );
}
