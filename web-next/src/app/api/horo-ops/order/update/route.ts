import { NextRequest, NextResponse } from "next/server"

import { HORO_OPS_SESSION_COOKIE } from "@/lib/horo-ops-constants"
import {
  horoOpsBackendSecret,
  medusaBackendBaseUrl,
  medusaPublishableKey,
} from "@/lib/horo-ops-medusa-fetch"
import { verifyHoroOpsSessionValue } from "@/lib/horo-ops-session"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const token = request.cookies.get(HORO_OPS_SESSION_COOKIE)?.value
  if (!verifyHoroOpsSessionValue(token)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const base = medusaBackendBaseUrl()
  if (!base) {
    return NextResponse.json({ message: "MEDUSA_BACKEND_URL is not configured." }, { status: 503 })
  }

  const secret = horoOpsBackendSecret()
  if (!secret) {
    return NextResponse.json(
      {
        message:
          "web-next is missing HORO_OPS_BACKEND_SECRET. Add it to .env.local (same value as medusa-backend) and restart Next.",
      },
      { status: 503 },
    )
  }

  const publishable = medusaPublishableKey()
  if (!publishable) {
    return NextResponse.json(
      {
        message:
          "web-next is missing NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY (or MEDUSA_PUBLISHABLE_KEY). Required for store-scoped ops routes.",
      },
      { status: 503 },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 })
  }

  const url = `${base}/store/custom/horo-ops/order/update`

  const medusaRes = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-publishable-api-key": publishable,
      "x-horo-ops-secret": secret,
    },
    body: JSON.stringify(body ?? {}),
    cache: "no-store",
  })

  const text = await medusaRes.text()
  const ct = medusaRes.headers.get("content-type") || "application/json"
  return new NextResponse(text, {
    status: medusaRes.status,
    headers: { "content-type": ct },
  })
}
