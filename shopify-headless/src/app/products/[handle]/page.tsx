import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { ProductViewTracker } from "@/components/analytics/product-view-tracker";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { formatMoney } from "@/lib/format";
import { siteUrl } from "@/lib/env";
import { getProductByHandle } from "@/lib/shopify/commerce";

type ProductDetailPageProps = {
  params: Promise<{ handle: string }>;
};

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  if (!product) {
    return {
      title: "Product not found",
    };
  }

  return {
    title: `${product.title} | HORO`,
    description: product.description.slice(0, 160),
    alternates: {
      canonical: `${siteUrl}/products/${product.handle}`,
    },
    openGraph: {
      title: product.title,
      description: product.description.slice(0, 160),
      images: product.featuredImage ? [{ url: product.featuredImage.url }] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  if (!product) {
    notFound();
  }

  const heroImage = product.featuredImage ?? product.images[0];
  const defaultVariant = product.variants[0];

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8">
      <ProductViewTracker
        productId={product.id}
        handle={product.handle}
        title={product.title}
        amount={product.priceRange.minVariantPrice.amount}
        currencyCode={product.priceRange.minVariantPrice.currencyCode}
      />
      <article className="grid gap-8 md:grid-cols-2">
        <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-black/5">
          {heroImage ? (
            <Image
              src={heroImage.url}
              alt={heroImage.altText ?? product.title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          ) : null}
        </div>

        <div className="space-y-5">
          <h1 className="text-4xl font-bold">{product.title}</h1>
          <p className="text-2xl font-semibold text-black/80">
            {formatMoney(
              product.priceRange.minVariantPrice.amount,
              product.priceRange.minVariantPrice.currencyCode
            )}
          </p>
          <p className="text-black/75">{product.description}</p>

          {defaultVariant ? (
            <AddToCartButton merchandiseId={defaultVariant.id} />
          ) : (
            <p className="text-sm text-red-700">No purchasable variant found for this product.</p>
          )}
        </div>
      </article>
    </main>
  );
}
