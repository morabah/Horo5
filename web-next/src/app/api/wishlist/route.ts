import { NextRequest, NextResponse } from "next/server";

import { medusaBackendBaseUrl, medusaPublishableKey } from "@/lib/horo-ops-medusa-fetch";
import {
  storefrontPublicApiCorsHeaders,
  withStorefrontPublicApiCors,
} from "@/lib/storefront-public-api-cors";

export const dynamic = "force-dynamic";

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: storefrontPublicApiCorsHeaders(request),
  });
}

const CLIENT_HEADER = "x-horo-wishlist-client";

async function proxyWishlist(request: NextRequest, method: "GET" | "POST" | "DELETE") {
  const base = medusaBackendBaseUrl();
  const publishable = medusaPublishableKey();
  const clientId = request.headers.get(CLIENT_HEADER)?.trim();

  if (!base || !publishable) {
    return corsJson(request, { ok: false, error: "Wishlist service is not configured." }, 503);
  }

  if (!clientId) {
    return corsJson(request, { ok: false, error: "Missing wishlist client id." }, 400);
  }

  const init: RequestInit = {
    method,
    headers: {
      "x-publishable-api-key": publishable,
      "content-type": "application/json",
      [CLIENT_HEADER]: clientId,
    },
    cache: "no-store",
  };

  if (method !== "GET") {
    init.body = await request.text();
  }

  const medusaRes = await fetch(`${base}/store/custom/wishlist`, init);
  const text = await medusaRes.text();
  return withStorefrontPublicApiCors(
    request,
    new NextResponse(text, {
      status: medusaRes.status,
      headers: { "content-type": medusaRes.headers.get("content-type") ?? "application/json" },
    }),
  );
}

function corsJson(request: NextRequest, body: unknown, status: number) {
  return withStorefrontPublicApiCors(request, NextResponse.json(body, { status }));
}

export async function GET(request: NextRequest) {
  try {
    return await proxyWishlist(request, "GET");
  } catch {
    return corsJson(request, { ok: false, error: "Wishlist temporarily unavailable." }, 502);
  }
}

export async function POST(request: NextRequest) {
  try {
    return await proxyWishlist(request, "POST");
  } catch {
    return corsJson(request, { ok: false, error: "Wishlist temporarily unavailable." }, 502);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    return await proxyWishlist(request, "DELETE");
  } catch {
    return corsJson(request, { ok: false, error: "Wishlist temporarily unavailable." }, 502);
  }
}
