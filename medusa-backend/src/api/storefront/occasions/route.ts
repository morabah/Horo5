import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { listStorefrontOccasions } from "../../../lib/storefront/catalog"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const occasions = await listStorefrontOccasions(req.scope)

  res.status(200).json({ occasions })
}
