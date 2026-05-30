type Bucket = { count: number; resetAt: number }

const ipBuckets = new Map<string, Bucket>()

const WINDOW_MS = 60 * 60 * 1000
const MAX_PER_IP = 20

export function allowAbandonCaptureFromIp(ip: string): boolean {
  const key = ip.trim() || "unknown"
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

export function clientIpFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  return forwarded || request.headers.get("x-real-ip")?.trim() || "unknown"
}
