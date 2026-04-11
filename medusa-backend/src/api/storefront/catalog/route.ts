import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { buildStorefrontCatalog } from "../../../lib/storefront/catalog"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const catalog = await buildStorefrontCatalog(req.scope)

  res.status(200).json(catalog)
}
