import { createHmac, timingSafeEqual } from "crypto"

const DEFAULT_TTL_SEC = 60 * 60 * 24 * 7 // 7 days

type RecoverPayload = {
  cart_id: string
  email: string
  exp: number
}

function secret(): string | null {
  const raw =
    process.env.HORO_CART_RECOVER_SECRET?.trim() ||
    process.env.JWT_SECRET?.trim() ||
    process.env.COOKIE_SECRET?.trim()
  return raw || null
}

function signPayload(encoded: string): string {
  const key = secret()
  if (!key) throw new Error("HORO_CART_RECOVER_SECRET is not configured.")
  return createHmac("sha256", key).update(encoded).digest("base64url")
}

function encodePayload(payload: RecoverPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url")
}

function decodePayload(encoded: string): RecoverPayload | null {
  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as RecoverPayload
    if (!parsed?.cart_id?.startsWith("cart_") || !parsed.email?.includes("@")) return null
    if (typeof parsed.exp !== "number" || parsed.exp < Date.now() / 1000) return null
    return parsed
  } catch {
    return null
  }
}

export function createCartRecoverToken(args: {
  cartId: string
  email: string
  ttlSec?: number
}): string | null {
  if (!secret()) return null
  const exp = Math.floor(Date.now() / 1000) + (args.ttlSec ?? DEFAULT_TTL_SEC)
  const encoded = encodePayload({
    cart_id: args.cartId,
    email: args.email.trim().toLowerCase(),
    exp,
  })
  const sig = signPayload(encoded)
  return `${encoded}.${sig}`
}

export function verifyCartRecoverToken(token: string): RecoverPayload | null {
  if (!secret()) return null
  const parts = token.trim().split(".")
  if (parts.length !== 2) return null
  const [encoded, sig] = parts
  const expected = signPayload(encoded)
  try {
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  } catch {
    return null
  }
  return decodePayload(encoded)
}

export function buildCartRecoverUrl(storeUrl: string, token: string): string {
  const base = storeUrl.replace(/\/$/, "")
  return `${base}/api/cart-recover?token=${encodeURIComponent(token)}`
}

export function createUnsubscribeToken(email: string): string | null {
  if (!secret()) return null
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365
  const encoded = Buffer.from(
    JSON.stringify({ email: email.trim().toLowerCase(), exp, kind: "abandon_unsub" }),
    "utf8",
  ).toString("base64url")
  const sig = signPayload(encoded)
  return `${encoded}.${sig}`
}

export function verifyUnsubscribeToken(token: string): string | null {
  if (!secret()) return null
  const parts = token.trim().split(".")
  if (parts.length !== 2) return null
  const [encoded, sig] = parts
  const expected = signPayload(encoded)
  try {
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  } catch {
    return null
  }
  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as {
      email?: string
      exp?: number
      kind?: string
    }
    if (parsed.kind !== "abandon_unsub" || !parsed.email?.includes("@")) return null
    if (typeof parsed.exp !== "number" || parsed.exp < Date.now() / 1000) return null
    return parsed.email.trim().toLowerCase()
  } catch {
    return null
  }
}
