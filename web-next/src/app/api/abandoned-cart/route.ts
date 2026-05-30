import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { medusaBackendBaseUrl, medusaPublishableKey } from "@/lib/horo-ops-medusa-fetch";
import {
  storefrontPublicApiCorsHeaders,
  withStorefrontPublicApiCors,
} from "@/lib/storefront-public-api-cors";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  email: z.string().email(),
  cart_id: z.string().min(1).optional(),
  surface: z.enum(["cart", "checkout", "plp"]).default("cart"),
  locale: z.enum(["en", "ar"]).default("en"),
  cart_value_egp: z.number().finite().nonnegative().optional(),
});

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: storefrontPublicApiCorsHeaders(request),
  });
}

export async function POST(request: NextRequest) {
  const parsed = BodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return withStorefrontPublicApiCors(
      request,
      NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 }),
    );
  }

  const base = medusaBackendBaseUrl();
  const publishable = medusaPublishableKey();
  if (!base || !publishable) {
    return withStorefrontPublicApiCors(
      request,
      NextResponse.json({ ok: false, error: "Abandoned cart service is not configured." }, { status: 503 }),
    );
  }

  try {
    const medusaRes = await fetch(`${base}/store/custom/abandoned-cart`, {
      method: "POST",
      headers: {
        "x-publishable-api-key": publishable,
        "content-type": "application/json",
      },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
    });

    const text = await medusaRes.text();
    return withStorefrontPublicApiCors(
      request,
      new NextResponse(text, {
        status: medusaRes.status,
        headers: { "content-type": medusaRes.headers.get("content-type") ?? "application/json" },
      }),
    );
  } catch {
    return withStorefrontPublicApiCors(
      request,
      NextResponse.json({ ok: false, error: "Abandoned cart service temporarily unavailable." }, { status: 502 }),
    );
  }
}
