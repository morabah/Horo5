import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { retrieveStorefrontSettingsPayload } from "../../../lib/storefront/store-settings"

/**
 * Public storefront settings subset (no secrets).
 * Operators set `store.metadata.delivery`, `store.metadata.sizeTables`, `store.metadata.defaultSizeTableKey`.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const payload = await retrieveStorefrontSettingsPayload(req.scope)
  res.status(200).json(payload)
}
