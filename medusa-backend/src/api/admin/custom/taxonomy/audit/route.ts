import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { runProductTaxonomyAudit } from "../../../../../lib/taxonomy/audit"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const take = Number(req.query.take ?? 500)
  const report = await runProductTaxonomyAudit(req.scope, {
    take: Number.isFinite(take) ? take : 500,
  })
  res.status(200).json({ report })
}
