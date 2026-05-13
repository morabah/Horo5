import type { Metadata } from "next";

import { ProductCard } from "@/components/product-card";
import { siteUrl } from "@/lib/env";
import { getProducts } from "@/lib/shopify/commerce";

export const metadata: Metadata = {
  title: "Products",
  alternates: {
    canonical: `${siteUrl}/products`,
  },
};

export default async function ProductsPage() {
  let products: Awaited<ReturnType<typeof getProducts>> = [];
  try {
    products = await getProducts(24);
  } catch {
    products = [];
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8">
      <section className="space-y-5">
        <h1 className="text-3xl font-bold">All Products</h1>
        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-black/15 p-6 text-sm text-black/65">
            Shopify products are unavailable right now.
          </div>
        )}
      </section>
    </main>
  );
}
