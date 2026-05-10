import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import {
  medusaBackendBaseUrl,
} from "@/lib/horo-ops-medusa-fetch";

export const dynamic = "force-dynamic";

/**
 * Launch-day toggle endpoint.
 *
 * POST /api/ops/launch
 * Headers: x-ops-secret (must match OPS_LAUNCH_SECRET env)
 * Body: { operator: string, confirmedBy: string }
 *
 * Actions:
 *   1. Revalidates catalog + homepage cache tags
 *   2. Triggers Medusa waitlist broadcast (admin/custom/waitlist/broadcast)
 *   3. Returns confirmation with timestamp
 *
 * Two-person approval: body must include both `operator` and `confirmedBy`.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.OPS_LAUNCH_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "OPS_LAUNCH_SECRET not configured on server." },
      { status: 500 }
    );
  }

  if (req.headers.get("x-ops-secret") !== secret) {
    return NextResponse.json(
      { ok: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const operator = typeof body.operator === "string" ? body.operator.trim() : "";
  const confirmedBy = typeof body.confirmedBy === "string" ? body.confirmedBy.trim() : "";

  if (!operator || !confirmedBy) {
    return NextResponse.json(
      { ok: false, error: "Two-person approval required: provide 'operator' and 'confirmedBy'." },
      { status: 400 }
    );
  }

  const log: string[] = [];

  // 1. Revalidate Next.js cache tags
  try {
    revalidateTag("catalog", "default");
    revalidateTag("homepage", "default");
    revalidateTag("settings", "default");
    log.push("Cache tags revalidated: catalog, homepage, settings");
  } catch (err) {
    log.push(`Cache revalidation failed: ${err instanceof Error ? err.message : "unknown"}`);
  }

  // 2. Trigger Medusa waitlist broadcast
  const medusaBase = medusaBackendBaseUrl();
  const adminToken = process.env.MEDUSA_ADMIN_API_TOKEN?.trim();
  let broadcastResult: { sent?: number; failed?: number; error?: string } = {};

  if (medusaBase && adminToken) {
    try {
      const broadcastRes = await fetch(`${medusaBase}/admin/custom/waitlist/broadcast`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${adminToken}`,
        },
        cache: "no-store",
      });

      if (broadcastRes.ok) {
        const data = (await broadcastRes.json().catch(() => ({}))) as {
          sent?: number;
          failed?: number;
        };
        broadcastResult = { sent: data.sent, failed: data.failed };
        log.push(`Broadcast sent: ${data.sent ?? 0} success, ${data.failed ?? 0} failed`);
      } else {
        const text = await broadcastRes.text().catch(() => "unknown");
        broadcastResult = { error: text };
        log.push(`Broadcast failed: ${broadcastRes.status} ${text}`);
      }
    } catch (err) {
      broadcastResult = { error: err instanceof Error ? err.message : "unknown" };
      log.push(`Broadcast error: ${broadcastResult.error}`);
    }
  } else {
    log.push("Skipped broadcast: MEDUSA_BACKEND_URL or MEDUSA_ADMIN_API_TOKEN not set");
  }

  return NextResponse.json({
    ok: true,
    at: new Date().toISOString(),
    operator,
    confirmedBy,
    broadcast: broadcastResult,
    log,
  });
}
