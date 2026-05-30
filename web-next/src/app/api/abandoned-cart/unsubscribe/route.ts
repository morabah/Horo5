import { NextRequest, NextResponse } from "next/server"

import { medusaBackendBaseUrl, medusaPublishableKey } from "@/lib/horo-ops-medusa-fetch"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim()
  if (!token) {
    return NextResponse.json({ ok: false, error: "Missing token." }, { status: 400 })
  }

  const base = medusaBackendBaseUrl()
  const publishable = medusaPublishableKey()
  if (!base || !publishable) {
    return NextResponse.json({ ok: false, error: "Service unavailable." }, { status: 503 })
  }

  try {
    const medusaRes = await fetch(
      `${base}/store/custom/abandoned-cart/unsubscribe?token=${encodeURIComponent(token)}`,
      {
        headers: { "x-publishable-api-key": publishable },
        cache: "no-store",
      },
    )
    const data = (await medusaRes.json().catch(() => ({}))) as { ok?: boolean }
    if (!medusaRes.ok || !data.ok) {
      return NextResponse.redirect(new URL("/?unsubscribe=invalid", request.url), 302)
    }
    return NextResponse.redirect(new URL("/?unsubscribe=cart-reminders", request.url), 302)
  } catch {
    return NextResponse.json({ ok: false, error: "Unsubscribe failed." }, { status: 502 })
  }
}
