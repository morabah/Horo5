import { NextRequest, NextResponse } from "next/server";

import { saveOrderEvent } from "@/lib/orders/store";
import { normalizeOrderPaidWebhook, verifyShopifyWebhookSignature } from "@/lib/shopify/webhooks";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const topic = request.headers.get("x-shopify-topic");
  const webhookId = request.headers.get("x-shopify-webhook-id");
  const hmac = request.headers.get("x-shopify-hmac-sha256");
  const shopDomain = request.headers.get("x-shopify-shop-domain");

  if (topic !== "orders/paid") {
    return NextResponse.json({ message: "Unexpected webhook topic." }, { status: 400 });
  }

  if (!webhookId) {
    return NextResponse.json({ message: "Missing Shopify webhook id." }, { status: 400 });
  }

  if (!verifyShopifyWebhookSignature(rawBody, hmac)) {
    return NextResponse.json({ message: "Invalid webhook signature." }, { status: 401 });
  }

  try {
    const payload = JSON.parse(rawBody) as Record<string, unknown>;
    const normalized = normalizeOrderPaidWebhook({
      payload,
      topic,
      webhookId,
      shopDomain,
    });
    const result = await saveOrderEvent(normalized);

    console.info(
      JSON.stringify({
        level: "info",
        scope: "shopify.webhooks.orders_paid",
        message: result.saved ? "Stored paid order event." : "Ignored duplicate paid order event.",
        context: {
          orderId: normalized.orderId,
          orderName: normalized.orderName,
          webhookId: normalized.webhookId,
          shopDomain: normalized.shopDomain,
          filePath: result.path,
        },
        timestamp: new Date().toISOString(),
      })
    );

    return NextResponse.json({ ok: true, duplicate: !result.saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    console.error(
      JSON.stringify({
        level: "error",
        scope: "shopify.webhooks.orders_paid",
        message,
        timestamp: new Date().toISOString(),
      })
    );

    return NextResponse.json({ message: "Unable to process webhook payload." }, { status: 500 });
  }
}
