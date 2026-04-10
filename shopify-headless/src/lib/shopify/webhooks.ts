import { createHmac, timingSafeEqual } from "node:crypto";

import { getShopifyWebhookSecret } from "@/lib/env";
import type { StoredOrderEvent } from "@/lib/orders/store";

type ShopifyOrderWebhookPayload = {
  id?: number | string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  financial_status?: string | null;
  fulfillment_status?: string | null;
  current_total_price?: string | null;
  currency?: string | null;
  order_status_url?: string | null;
  created_at?: string | null;
  processed_at?: string | null;
  customer?: {
    email?: string | null;
    phone?: string | null;
  } | null;
};

export function verifyShopifyWebhookSignature(rawBody: string, providedSignature: string | null): boolean {
  if (!providedSignature) {
    return false;
  }

  const digest = createHmac("sha256", getShopifyWebhookSecret()).update(rawBody, "utf8").digest("base64");
  const providedBuffer = Buffer.from(providedSignature, "utf8");
  const expectedBuffer = Buffer.from(digest, "utf8");

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
}

export function normalizeOrderPaidWebhook(params: {
  payload: ShopifyOrderWebhookPayload;
  topic: string;
  webhookId: string;
  shopDomain: string | null;
}): StoredOrderEvent {
  const { payload, topic, webhookId, shopDomain } = params;

  if (payload.id == null) {
    throw new Error("Shopify order webhook payload is missing an order id.");
  }

  return {
    source: "shopify",
    topic,
    webhookId,
    shopDomain,
    orderId: String(payload.id),
    orderName: payload.name ?? null,
    financialStatus: payload.financial_status ?? null,
    fulfillmentStatus: payload.fulfillment_status ?? null,
    customerEmail: payload.email ?? payload.customer?.email ?? null,
    customerPhone: payload.phone ?? payload.customer?.phone ?? null,
    totalPrice: payload.current_total_price ?? null,
    currency: payload.currency ?? null,
    orderStatusUrl: payload.order_status_url ?? null,
    createdAt: payload.created_at ?? null,
    processedAt: payload.processed_at ?? null,
    recordedAt: new Date().toISOString(),
  };
}
