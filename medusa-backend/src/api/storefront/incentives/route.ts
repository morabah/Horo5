import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { retrieveStorefrontIncentivesPayload } from "../../../lib/storefront/incentives"

/**
 * Public storefront incentives projection.
 * Reads native Medusa Promotions (automatic + active) plus the gift-wrap product handle
 * and returns display-only labels. The cart math itself stays inside Medusa.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const payload = await retrieveStorefrontIncentivesPayload(req.scope)
  res.status(200).json(payload)
}
