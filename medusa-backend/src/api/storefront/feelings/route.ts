import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { listStorefrontFeelings, listStorefrontSubfeelings } from "../../../lib/storefront/catalog"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const [feelings, subfeelings] = await Promise.all([
    listStorefrontFeelings(req.scope),
    listStorefrontSubfeelings(req.scope),
  ])

  res.status(200).json({ feelings, subfeelings })
}
