import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { retrieveCatalogSyncStatus } from "../../../../../lib/catalog-sync/admin"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const status = await retrieveCatalogSyncStatus(req.scope)
  res.status(200).json({ status })
}
