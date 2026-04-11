import { MedusaError } from "@medusajs/framework/utils"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  listStorefrontSubfeelings,
  retrieveStorefrontFeeling,
} from "../../../../lib/storefront/catalog"

export async function GET(req: MedusaRequest<{ slug: string }>, res: MedusaResponse) {
  const [feeling, subfeelings] = await Promise.all([
    retrieveStorefrontFeeling(req.scope, req.params.slug),
    listStorefrontSubfeelings(req.scope),
  ])

  if (!feeling) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Storefront feeling "${req.params.slug}" was not found`)
  }

  res.status(200).json({
    feeling,
    subfeelings: subfeelings.filter((subfeeling) => subfeeling.feelingSlug === feeling.slug),
  })
}
