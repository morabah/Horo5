import { NextRequest, NextResponse } from "next/server";
import { WaitlistSignupSchema } from "@/lib/schemas/waitlist";
import {
  medusaBackendBaseUrl,
  medusaPublishableKey,
} from "@/lib/horo-ops-medusa-fetch";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as unknown;
  const parsed = WaitlistSignupSchema.safeParse(body);

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
      { ok: false, error: "Waitlist service is not configured." },
      { status: 503 }
    );
  }

  try {
    const payload = {
      email: parsed.data.email,
      locale: parsed.data.locale,
      source: parsed.data.source,
      ...(parsed.data.referralCode ? { referral_code: parsed.data.referralCode } : {}),
    }

    const medusaRes = await fetch(`${base}/store/waitlist`, {
      method: "POST",
      headers: {
        "x-publishable-api-key": publishable,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
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
      referral_code?: string;
    };

    return NextResponse.json({
      ok: true,
      duplicate: data.duplicate === true,
      ...(data.referral_code ? { referral_code: data.referral_code } : {}),
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Waitlist service temporarily unavailable." },
      { status: 502 }
    );
  }
}
