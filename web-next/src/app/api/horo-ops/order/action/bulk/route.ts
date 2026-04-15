import { NextRequest, NextResponse } from "next/server";

import { runPoolByIndex } from "@/app/internal/horo-ops/horo-ops-bulk-pool";
import { HORO_OPS_SESSION_COOKIE } from "@/lib/horo-ops-constants";
import {
  horoOpsBackendSecret,
  isLikelyMedusaConnectionFailure,
  medusaBackendBaseUrl,
  medusaPublishableKey,
} from "@/lib/horo-ops-medusa-fetch";
import { verifyHoroOpsSessionValue } from "@/lib/horo-ops-session";

export const dynamic = "force-dynamic";

const MAX_IDS = 50;
const CONCURRENCY = 4;

type BulkResult = { order_id: string; ok: boolean; error?: string };

async function postSingleAction(
  base: string,
  publishable: string,
  secret: string,
  orderId: string,
  action: string,
): Promise<{ ok: boolean; status: number; text: string }> {
  const url = `${base}/store/custom/horo-ops/order/action`;
  const medusaRes = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-publishable-api-key": publishable,
      "x-horo-ops-secret": secret,
    },
    body: JSON.stringify({ order_id: orderId, action }),
    cache: "no-store",
  });
  const text = await medusaRes.text();
  return { ok: medusaRes.ok, status: medusaRes.status, text };
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get(HORO_OPS_SESSION_COOKIE)?.value;
  if (!verifyHoroOpsSessionValue(token)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const base = medusaBackendBaseUrl();
  if (!base) {
    return NextResponse.json({ message: "MEDUSA_BACKEND_URL is not configured." }, { status: 503 });
  }

  const secret = horoOpsBackendSecret();
  if (!secret) {
    return NextResponse.json(
      {
        message:
          "web-next is missing HORO_OPS_BACKEND_SECRET. Add it to .env.local (same value as medusa-backend) and restart Next.",
      },
      { status: 503 },
    );
  }

  const publishable = medusaPublishableKey();
  if (!publishable) {
    return NextResponse.json(
      {
        message:
          "web-next is missing NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY (or MEDUSA_PUBLISHABLE_KEY). Required for store-scoped ops routes.",
      },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const rec = body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
  const action = typeof rec.action === "string" ? rec.action : "";
  if (action !== "capture_payment") {
    return NextResponse.json({ message: "Only capture_payment is supported for bulk actions." }, { status: 400 });
  }

  const rawIds = rec.order_ids;
  const orderIds = Array.isArray(rawIds) ? rawIds.map((x) => String(x ?? "").trim()).filter(Boolean) : [];
  if (orderIds.length === 0) {
    return NextResponse.json({ message: "order_ids must be a non-empty array." }, { status: 400 });
  }
  if (orderIds.length > MAX_IDS) {
    return NextResponse.json({ message: `At most ${MAX_IDS} orders per bulk request.` }, { status: 400 });
  }

  const results: BulkResult[] = await runPoolByIndex(orderIds.length, CONCURRENCY, async (i) => {
    const order_id = orderIds[i];
    try {
      const r = await postSingleAction(base, publishable, secret, order_id, action);
      if (r.ok) {
        return { order_id, ok: true as const };
      }
      return { order_id, ok: false as const, error: r.text || `HTTP ${r.status}` };
    } catch (e) {
      if (isLikelyMedusaConnectionFailure(e)) {
        return { order_id, ok: false as const, error: "Medusa unreachable." };
      }
      return {
        order_id,
        ok: false as const,
        error: e instanceof Error ? e.message : "Request failed",
      };
    }
  });

  return NextResponse.json({ results });
}
