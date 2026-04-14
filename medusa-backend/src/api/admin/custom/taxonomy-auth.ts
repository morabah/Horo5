import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

type RequestWithAuthContext = MedusaRequest & {
  auth_context?: {
    actor_id?: string
    actor_type?: string
  }
}

/**
 * Mutating `/admin/custom/*` taxonomy routes accept either:
 * - Header `x-horo-taxonomy-secret` matching `HORO_TAXONOMY_ADMIN_SECRET` when set (scripts / tooling), or
 * - An authenticated Medusa Admin session (`auth_context.actor_id` on `/admin/*` routes).
 *
 * In production, `HORO_TAXONOMY_ADMIN_SECRET` must still be set (503 if missing) so the deployment
 * is explicitly configured; Admin UI users do not need to send the header.
 */
export function assertTaxonomyAdminWrite(req: MedusaRequest, res: MedusaResponse): boolean {
  const secret = process.env.HORO_TAXONOMY_ADMIN_SECRET?.trim()
  const isProd = process.env.NODE_ENV === "production"

  if (isProd && !secret) {
    res.status(503).json({ message: "Taxonomy admin API is not configured (missing HORO_TAXONOMY_ADMIN_SECRET)." })
    return false
  }

  if (!secret) {
    return true
  }

  const sent = req.headers["x-horo-taxonomy-secret"]
  const value = Array.isArray(sent) ? sent[0] : sent

  if (value === secret) {
    return true
  }

  const actorId = (req as RequestWithAuthContext).auth_context?.actor_id
  if (typeof actorId === "string" && actorId.length > 0) {
    return true
  }

  res.status(401).json({ message: "Unauthorized" })
  return false
}
