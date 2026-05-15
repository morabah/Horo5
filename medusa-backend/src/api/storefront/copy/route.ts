import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { getStorefrontCopy } from "../../../lib/storefront/copy"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const payload = await getStorefrontCopy(req.scope)
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=900")
  res.status(200).json(payload)
}
