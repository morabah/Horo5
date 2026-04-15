import { timingSafeEqual } from "node:crypto"

import { NextRequest, NextResponse } from "next/server"

import { HORO_OPS_SESSION_COOKIE } from "@/lib/horo-ops-constants"
import { createHoroOpsSessionValue } from "@/lib/horo-ops-session"

export const dynamic = "force-dynamic"

function readUiPassword(): string {
  const key = ["HORO", "_OPS", "_UI", "_PASSWORD"].join("")
  const v = process.env[key]
  return typeof v === "string" ? v.trim() : ""
}

function timingSafeStringEqual(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, "utf8")
    const bb = Buffer.from(b, "utf8")
    if (ba.length !== bb.length) return false
    return timingSafeEqual(ba, bb)
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  const expected = readUiPassword()
  if (!expected) {
    return NextResponse.json(
      { message: "HORO_OPS_UI_PASSWORD is not configured on the web server." },
      { status: 503 },
    )
  }

  const body = (await request.json().catch(() => ({}))) as { password?: string }
  const password = typeof body.password === "string" ? body.password : ""
  if (!timingSafeStringEqual(password, expected)) {
    return NextResponse.json({ message: "Invalid password" }, { status: 401 })
  }

  const token = createHoroOpsSessionValue()
  if (!token) {
    return NextResponse.json(
      {
        message:
          "Cannot create session: set HORO_OPS_COOKIE_SECRET or HORO_OPS_BACKEND_SECRET (or rely on HORO_OPS_UI_PASSWORD for signing in dev).",
      },
      { status: 503 },
    )
  }

  const res = NextResponse.json({ ok: true })
  const secure = process.env.NODE_ENV === "production"
  res.cookies.set(HORO_OPS_SESSION_COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(HORO_OPS_SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 })
  return res
}
