import type { MetadataRoute } from "next";

import { fetchStorefrontCatalogServer } from "@/lib/storefront-server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = (process.env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/+$/, "") || "http://localhost:3000";

  const catalog = await fetchStorefrontCatalogServer().catch(() => null);
  const products = catalog?.products ?? [];

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${site}/`, lastModified: new Date() },
    { url: `${site}/shop`, lastModified: new Date() },
    { url: `${site}/feelings`, lastModified: new Date() },
  ];

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${site}/products/${encodeURIComponent(product.slug)}`,
    lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
  }));

  return [...staticRoutes, ...productRoutes];
}
