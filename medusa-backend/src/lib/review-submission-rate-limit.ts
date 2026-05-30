import type { MedusaRequest } from "@medusajs/framework/http"

type Bucket = { count: number; resetAt: number }
const ipBuckets = new Map<string, Bucket>()

const WINDOW_MS = 60 * 60 * 1000
const MAX_PER_IP = 10

function clientIp(req: MedusaRequest): string {
  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0]?.trim()
  return forwarded || String(req.headers["x-real-ip"] || "").trim() || "unknown"
}

export function allowReviewSubmission(req: MedusaRequest): boolean {
  const key = clientIp(req)
  const now = Date.now()
  const entry = ipBuckets.get(key)
  if (!entry || now > entry.resetAt) {
    ipBuckets.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }
  if (entry.count >= MAX_PER_IP) return false
  entry.count += 1
  return true
}
