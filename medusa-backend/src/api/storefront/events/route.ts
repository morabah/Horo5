import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { listStorefrontMerchEvents } from "../../../lib/storefront/catalog"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const events = await listStorefrontMerchEvents(req.scope)

  res.status(200).json({ events })
}
