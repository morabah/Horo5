import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { getStorefrontCatalogWithServerCache } from "../../../lib/storefront/catalog"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const catalog = await getStorefrontCatalogWithServerCache(req.scope)

  res.status(200).json(catalog)
}
