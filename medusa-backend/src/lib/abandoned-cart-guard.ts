import type { MedusaRequest } from "@medusajs/framework/http"

type Bucket = { count: number; resetAt: number }

const ipBuckets = new Map<string, Bucket>()
const emailBuckets = new Map<string, Bucket>()

const WINDOW_MS = parseInt(process.env.HORO_ABANDON_CAPTURE_WINDOW_MS ?? "3600000", 10) || 3_600_000
const MAX_PER_IP = parseInt(process.env.HORO_ABANDON_CAPTURE_MAX_PER_IP ?? "15", 10) || 15
const MAX_PER_EMAIL = parseInt(process.env.HORO_ABANDON_CAPTURE_MAX_PER_EMAIL ?? "3", 10) || 3

export const MAX_REMINDERS_PER_LEAD = parseInt(process.env.HORO_ABANDON_MAX_REMINDERS ?? "1", 10) || 1

export function normalizedCartKey(email: string, cartId: string | null): string {
  const normalizedEmail = email.trim().toLowerCase()
  const cartPart = cartId?.trim() || "__none__"
  return `${normalizedEmail}::${cartPart}`
}

function clientIp(req: MedusaRequest): string {
  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0]?.trim()
  if (forwarded) return forwarded
  return String(req.headers["x-real-ip"] || "").trim() || "unknown"
}

function checkBucket(map: Map<string, Bucket>, key: string, max: number): boolean {
  const now = Date.now()
  const entry = map.get(key)
  if (!entry || now > entry.resetAt) {
    map.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }
  if (entry.count >= max) return false
  entry.count += 1
  return true
}

/** Returns false when rate limited. */
export function allowAbandonCapture(req: MedusaRequest, email: string): boolean {
  const ipOk = checkBucket(ipBuckets, clientIp(req), MAX_PER_IP)
  const emailOk = checkBucket(emailBuckets, email.trim().toLowerCase(), MAX_PER_EMAIL)
  return ipOk && emailOk
}
