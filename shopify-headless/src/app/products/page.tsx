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
  const products = await getProducts(24);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8">
      <section className="space-y-5">
        <h1 className="text-3xl font-bold">All Products</h1>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </main>
  );
}
