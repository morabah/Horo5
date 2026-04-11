import { MedusaError } from "@medusajs/framework/utils"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { retrieveStorefrontMerchEvent } from "../../../../lib/storefront/catalog"

export async function GET(req: MedusaRequest<{ slug: string }>, res: MedusaResponse) {
  const event = await retrieveStorefrontMerchEvent(req.scope, req.params.slug)

  if (!event) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Storefront event "${req.params.slug}" was not found`)
  }

  res.status(200).json({ event })
}
