import { getShopifyEnv } from "@/lib/env";
import { ExternalServiceError } from "@/lib/errors";
import type { ShopifyGraphQLError } from "@/lib/shopify/types";

type ShopifyResponse<TData> = {
  data?: TData;
  errors?: ShopifyGraphQLError[];
};

export async function shopifyFetch<TData, TVariables = Record<string, unknown>>(params: {
  query: string;
  variables?: TVariables;
  cache?: RequestCache;
  tags?: string[];
  revalidate?: number;
}): Promise<TData> {
  const shopifyEnv = getShopifyEnv();
  const endpoint = `https://${shopifyEnv.storeDomain}/api/${shopifyEnv.apiVersion}/graphql.json`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": shopifyEnv.storefrontAccessToken,
    },
    body: JSON.stringify({
      query: params.query,
      variables: params.variables ?? {},
    }),
    cache: params.cache ?? "no-store",
    next: params.tags || params.revalidate ? { tags: params.tags, revalidate: params.revalidate } : undefined,
  });

  if (!response.ok) {
    throw new ExternalServiceError("shopify", "Failed to communicate with Shopify.", {
      statusCode: response.status,
    });
  }

  const payload = (await response.json()) as ShopifyResponse<TData>;

  if (payload.errors?.length) {
    throw new ExternalServiceError("shopify", payload.errors[0]?.message ?? "Shopify query failed.");
  }

  if (!payload.data) {
    throw new ExternalServiceError("shopify", "Shopify returned an empty response.");
  }

  return payload.data;
}
