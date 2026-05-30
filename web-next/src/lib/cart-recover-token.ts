import { createHmac, timingSafeEqual } from "crypto"

type RecoverPayload = {
  cart_id: string
  email: string
  exp: number
}

function secret(): string | null {
  const raw = process.env.HORO_CART_RECOVER_SECRET?.trim() || process.env.HORO_OPS_COOKIE_SECRET?.trim()
  return raw || null
}

function signPayload(encoded: string): string | null {
  const key = secret()
  if (!key) return null
  return createHmac("sha256", key).update(encoded).digest("base64url")
}

export function verifyCartRecoverToken(token: string): RecoverPayload | null {
  if (!secret()) return null
  const parts = token.trim().split(".")
  if (parts.length !== 2) return null
  const [encoded, sig] = parts
  const expected = signPayload(encoded)
  if (!expected) return null
  try {
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  } catch {
    return null
  }
  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as RecoverPayload
    if (!parsed?.cart_id?.startsWith("cart_") || !parsed.email?.includes("@")) return null
    if (typeof parsed.exp !== "number" || parsed.exp < Date.now() / 1000) return null
    return parsed
  } catch {
    return null
  }
}
