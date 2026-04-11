import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/** Set `HORO_TAXONOMY_ADMIN_SECRET` in production; send header `x-horo-taxonomy-secret: <secret>` on mutating requests. */
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

  if (value !== secret) {
    res.status(401).json({ message: "Unauthorized" })
    return false
  }

  return true
}
