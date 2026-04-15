import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

type RequestWithAuthContext = MedusaRequest & {
  auth_context?: {
    actor_id?: string
    actor_type?: string
  }
}

/**
 * HORO ops HTTP routes (under **`/store/custom/horo-ops/*`**) accept either:
 * - Header `x-horo-ops-secret` matching `HORO_OPS_BACKEND_SECRET` when set (web-next proxy), or
 * - `Authorization: Bearer <same secret>` (some proxies strip custom `x-*` headers), or
 * - An authenticated Medusa Admin session (`auth_context.actor_id`) when the route is reached via Admin.
 *
 * **Why `/store/`:** Medusa applies global JWT auth to **`/admin/*`** before custom route handlers run, so
 * server-to-server calls with only `x-horo-ops-secret` never reach this check. Store routes require the
 * publishable key header instead; the ops secret remains required for order data.
 *
 * In production, `HORO_OPS_BACKEND_SECRET` must be set (503 if missing).
 */
function normalizeEnvSecret(raw: string | undefined): string {
  if (typeof raw !== "string") return ""
  return raw.replace(/^\ufeff/, "").replace(/\r$/, "").trim()
}

function extractProxiedSecret(req: MedusaRequest): string {
  const sent = req.headers["x-horo-ops-secret"]
  const raw = Array.isArray(sent) ? sent[0] : sent
  const fromHeader = typeof raw === "string" ? normalizeEnvSecret(raw) : ""
  if (fromHeader) return fromHeader

  const auth = req.headers["authorization"]
  const authStr = Array.isArray(auth) ? auth[0] : auth
  if (typeof authStr !== "string") return ""
  const m = authStr.match(/^Bearer\s+(.+)$/i)
  if (!m?.[1]) return ""
  return normalizeEnvSecret(m[1])
}

export function assertOpsBackendAccess(req: MedusaRequest, res: MedusaResponse): boolean {
  const secret = normalizeEnvSecret(process.env.HORO_OPS_BACKEND_SECRET)
  const isProd = process.env.NODE_ENV === "production"

  if (isProd && !secret) {
    res.status(503).json({ message: "HORO ops API is not configured (missing HORO_OPS_BACKEND_SECRET)." })
    return false
  }

  if (!secret) {
    return true
  }

  const value = extractProxiedSecret(req)

  if (value === secret) {
    return true
  }

  const actorId = (req as RequestWithAuthContext).auth_context?.actor_id
  if (typeof actorId === "string" && actorId.length > 0) {
    return true
  }

  res.status(401).json({ message: "Unauthorized", code: "horo_ops_auth_failed" })
  return false
}
