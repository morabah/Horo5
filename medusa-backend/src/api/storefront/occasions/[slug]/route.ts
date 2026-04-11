import { MedusaError } from "@medusajs/framework/utils"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { retrieveStorefrontOccasion } from "../../../../lib/storefront/catalog"

export async function GET(req: MedusaRequest<{ slug: string }>, res: MedusaResponse) {
  const occasion = await retrieveStorefrontOccasion(req.scope, req.params.slug)

  if (!occasion) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Storefront occasion "${req.params.slug}" was not found`)
  }

  res.status(200).json({ occasion })
}
