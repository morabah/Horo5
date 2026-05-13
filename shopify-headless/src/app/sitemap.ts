import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/env";
import { getProducts } from "@/lib/shopify/commerce";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = ["", "/products", "/gifts", "/cart"].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
  }));

  let products: Awaited<ReturnType<typeof getProducts>> = [];
  try {
    products = await getProducts(100);
  } catch {
    products = [];
  }
  const productRoutes = products.map((product) => ({
    url: `${siteUrl}/products/${product.handle}`,
    lastModified: new Date(),
  }));

  return [...staticRoutes, ...productRoutes];
}
