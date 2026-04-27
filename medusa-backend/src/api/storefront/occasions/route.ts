import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { listStorefrontOccasions } from "../../../lib/storefront/catalog"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const occasions = await listStorefrontOccasions(req.scope)

  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=900")
  res.status(200).json({ occasions })
}
