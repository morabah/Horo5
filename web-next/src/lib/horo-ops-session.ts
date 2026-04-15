import { createHmac, timingSafeEqual } from "node:crypto"

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

function envTrimDynamic(suffixParts: string[]): string {
  const key = ["HORO", "_OPS", ...suffixParts].join("")
  const v = process.env[key]
  return typeof v === "string" ? v.trim() : ""
}

function cookieSigningSecret(): string {
  const s =
    envTrimDynamic(["_COOKIE", "_SECRET"]) ||
    envTrimDynamic(["_BACKEND", "_SECRET"]) ||
    envTrimDynamic(["_UI", "_PASSWORD"])
  return s || ""
}

function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url")
}

/**
 * Build a signed session value: `v1.<base64url(json)>.<sig>`.
 * Only call from server (Route Handler / Server Component).
 */
export function createHoroOpsSessionValue(nowMs: number = Date.now()): string | null {
  const secret = cookieSigningSecret()
  if (!secret) return null
  const exp = nowMs + MAX_AGE_MS
  const body = Buffer.from(JSON.stringify({ exp }), "utf8").toString("base64url")
  const sig = signPayload(body, secret)
  return `v1.${body}.${sig}`
}

export function verifyHoroOpsSessionValue(token: string | undefined | null, nowMs: number = Date.now()): boolean {
  if (!token || typeof token !== "string") return false
  const secret = cookieSigningSecret()
  if (!secret) return false
  const parts = token.split(".")
  if (parts.length !== 3 || parts[0] !== "v1") return false
  const [, body, sig] = parts
  if (!body || !sig) return false
  const expected = signPayload(body, secret)
  try {
    const a = Buffer.from(sig, "base64url")
    const b = Buffer.from(expected, "base64url")
    if (a.length !== b.length) return false
    if (!timingSafeEqual(a, b)) return false
  } catch {
    return false
  }
  let exp = 0
  try {
    const json = Buffer.from(body, "base64url").toString("utf8")
    const parsed = JSON.parse(json) as { exp?: number }
    exp = typeof parsed.exp === "number" ? parsed.exp : 0
  } catch {
    return false
  }
  return exp > nowMs
}
