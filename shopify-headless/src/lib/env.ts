import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  SHOPIFY_STORE_DOMAIN: z.string().min(1).optional(),
  SHOPIFY_STOREFRONT_ACCESS_TOKEN: z.string().min(1).optional(),
  SHOPIFY_STOREFRONT_API_VERSION: z.string().default("2025-01").optional(),
  SHOPIFY_WEBHOOK_SECRET: z.string().min(1).optional(),
  ORDER_EVENTS_STORE_PATH: z.string().min(1).optional(),
  NEXT_PUBLIC_GTM_ID: z.string().optional(),
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
  NEXT_PUBLIC_META_PIXEL_ID: z.string().optional(),
});

const parsed = envSchema.parse(process.env);

export const env = parsed;

export const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function getShopifyEnv() {
  if (!env.SHOPIFY_STORE_DOMAIN || !env.SHOPIFY_STOREFRONT_ACCESS_TOKEN) {
    throw new Error(
      "Missing Shopify env vars: SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_ACCESS_TOKEN are required."
    );
  }

  return {
    storeDomain: env.SHOPIFY_STORE_DOMAIN,
    storefrontAccessToken: env.SHOPIFY_STOREFRONT_ACCESS_TOKEN,
    apiVersion: env.SHOPIFY_STOREFRONT_API_VERSION ?? "2025-01",
  };
}

export function hasShopifyEnv(): boolean {
  return Boolean(env.SHOPIFY_STORE_DOMAIN && env.SHOPIFY_STOREFRONT_ACCESS_TOKEN);
}

export function getShopifyWebhookSecret(): string {
  if (!env.SHOPIFY_WEBHOOK_SECRET) {
    throw new Error("Missing Shopify env var: SHOPIFY_WEBHOOK_SECRET is required for webhook verification.");
  }

  return env.SHOPIFY_WEBHOOK_SECRET;
}

export function getOrderEventsStorePath(): string | undefined {
  return env.ORDER_EVENTS_STORE_PATH;
}
