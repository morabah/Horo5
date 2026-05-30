import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { medusaBackendBaseUrl, medusaPublishableKey } from "@/lib/horo-ops-medusa-fetch";

export const dynamic = "force-dynamic";

const ReviewSchema = z.object({
  product_id: z.string().min(1),
  body: z.string().optional(),
  email: z.string().email().optional(),
  locale: z.enum(["en", "ar"]).default("en"),
  photo_url: z.string().url().optional(),
  instagram_handle: z.string().max(64).optional(),
  permission_to_repost: z.boolean().optional(),
  fit_feedback: z.string().max(500).optional(),
  gift_feedback: z.string().max(500).optional(),
  ugc_type: z.enum(["review", "photo", "video", "delivery_reaction"]).optional(),
});

export async function POST(request: NextRequest) {
  const parsed = ReviewSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }

  const base = medusaBackendBaseUrl();
  const publishable = medusaPublishableKey();
  if (!base || !publishable) {
    return NextResponse.json({ ok: false, error: "Review service is not configured." }, { status: 503 });
  }

  if (!parsed.data.body?.trim() && !parsed.data.photo_url) {
    return NextResponse.json({ ok: false, error: "body or photo_url is required." }, { status: 400 });
  }

  try {
    const medusaRes = await fetch(`${base}/store/custom/reviews`, {
      method: "POST",
      headers: {
        "x-publishable-api-key": publishable,
        "content-type": "application/json",
      },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
    });

    const text = await medusaRes.text();
    return new NextResponse(text, {
      status: medusaRes.status,
      headers: { "content-type": medusaRes.headers.get("content-type") ?? "application/json" },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Review service temporarily unavailable." }, { status: 502 });
  }
}
