import { MedusaError } from "@medusajs/framework/utils"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { retrieveStorefrontProduct } from "../../../../lib/storefront/catalog"

export async function GET(req: MedusaRequest<{ handle: string }>, res: MedusaResponse) {
  const product = await retrieveStorefrontProduct(req.scope, req.params.handle)

  if (!product) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Storefront product "${req.params.handle}" was not found`)
  }

  res.status(200).json({ product })
}
