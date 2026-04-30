import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { buildCatalogSyncOptionsFromAdminBody } from "../../../../../lib/catalog-sync/admin"
import { runCatalogSync } from "../../../../../lib/catalog-sync/sync"
import { assertTaxonomyAdminWrite } from "../../taxonomy-auth"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (!assertTaxonomyAdminWrite(req, res)) {
    return
  }

  try {
    const options = buildCatalogSyncOptionsFromAdminBody((req.body || {}) as Record<string, unknown>, true)
    const report = await runCatalogSync({ container: req.scope, options })
    res.status(200).json({ report })
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : String(error) })
  }
}
