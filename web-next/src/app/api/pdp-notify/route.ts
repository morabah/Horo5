import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  medusaBackendBaseUrl,
  medusaPublishableKey,
} from "@/lib/horo-ops-medusa-fetch";

export const dynamic = "force-dynamic";

const PdpNotifySchema = z.object({
  product_id: z.string().min(1),
  email: z.string().email(),
  locale: z.enum(["en", "ar"]).default("en"),
});

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as unknown;
  const parsed = PdpNotifySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid request body" },
      { status: 400 }
    );
  }

  const base = medusaBackendBaseUrl();
  const publishable = medusaPublishableKey();

  if (!base || !publishable) {
    return NextResponse.json(
      { ok: false, error: "PDP notify service is not configured." },
      { status: 503 }
    );
  }

  try {
    const medusaRes = await fetch(`${base}/store/pdp-notify`, {
      method: "POST",
      headers: {
        "x-publishable-api-key": publishable,
        "content-type": "application/json",
      },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
    });

    if (!medusaRes.ok) {
      const text = await medusaRes.text().catch(() => "unknown error");
      return NextResponse.json(
        { ok: false, error: text },
        { status: medusaRes.status }
      );
    }

    const data = (await medusaRes.json().catch(() => ({}))) as {
      ok?: boolean;
      duplicate?: boolean;
    };

    return NextResponse.json({
      ok: true,
      duplicate: data.duplicate === true,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "PDP notify service temporarily unavailable." },
      { status: 502 }
    );
  }
}
