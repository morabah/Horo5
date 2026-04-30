import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  buildCatalogSyncOptionsFromAdminBody,
  recordCatalogSyncStatus,
} from "../../../../../lib/catalog-sync/admin"
import { revalidateStorefrontForDrop } from "../../../../../lib/drops/revalidate-storefront"
import { runCatalogSync } from "../../../../../lib/catalog-sync/sync"
import { assertTaxonomyAdminWrite } from "../../taxonomy-auth"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (!assertTaxonomyAdminWrite(req, res)) {
    return
  }

  try {
    const options = buildCatalogSyncOptionsFromAdminBody((req.body || {}) as Record<string, unknown>, false)
    const report = await runCatalogSync({ container: req.scope, options })
    const hasBlockingIssues = !options.allowPartial && (report.validationIssues.length > 0 || report.stageErrors.length > 0)
    if (hasBlockingIssues) {
      res.status(422).json({
        message: "Catalog sync finished with blocking validation or stage issues.",
        report,
      })
      return
    }

    const status = await recordCatalogSyncStatus(req.scope, report)
    revalidateStorefrontForDrop("*")
    res.status(200).json({ report, status })
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : String(error) })
  }
}
