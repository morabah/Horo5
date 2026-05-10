import type { MetadataRoute } from "next";

import { fetchStorefrontCatalogServer } from "@/lib/storefront-server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = (process.env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/+$/, "") || "http://localhost:3000";

  const catalog = await fetchStorefrontCatalogServer().catch(() => null);
  const products = catalog?.products ?? [];
  const feelings = catalog?.feelings ?? [];
  const occasions = catalog?.occasions ?? [];

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${site}/`, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${site}/shop`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${site}/products`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${site}/feelings`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${site}/occasions`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${site}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${site}/faq`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${site}/exchange`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${site}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${site}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${site}/products/${encodeURIComponent(product.slug)}`,
    lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const feelingRoutes: MetadataRoute.Sitemap = feelings.map((f) => ({
    url: `${site}/feelings/${encodeURIComponent(f.slug)}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const occasionRoutes: MetadataRoute.Sitemap = occasions.map((o) => ({
    url: `${site}/occasions/${encodeURIComponent(o.slug)}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...productRoutes, ...feelingRoutes, ...occasionRoutes];
}
