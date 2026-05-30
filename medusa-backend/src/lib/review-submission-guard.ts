const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const BLOCKED_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0"])

export function isValidReviewPhotoUrl(raw: string): boolean {
  try {
    const url = new URL(raw.trim())
    if (url.protocol !== "https:") return false
    const host = url.hostname.toLowerCase()
    if (BLOCKED_HOSTS.has(host)) return false
    if (host.endsWith(".local")) return false
    if (/^10\.|^192\.168\.|^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return false
    return true
  } catch {
    return false
  }
}

export function sanitizeInstagramHandle(raw: string | null): string | null {
  if (!raw?.trim()) return null
  const handle = raw.trim().replace(/^@/, "").slice(0, 64)
  return /^[a-zA-Z0-9._]+$/.test(handle) ? handle : null
}

export function isValidReviewEmail(raw: string): boolean {
  return EMAIL_RE.test(raw.trim().toLowerCase())
}
