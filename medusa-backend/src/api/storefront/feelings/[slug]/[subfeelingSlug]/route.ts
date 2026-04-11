import { MedusaError } from "@medusajs/framework/utils"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  retrieveStorefrontFeeling,
  retrieveStorefrontSubfeeling,
} from "../../../../../lib/storefront/catalog"

export async function GET(
  req: MedusaRequest<{ slug: string; subfeelingSlug: string }>,
  res: MedusaResponse
) {
  const [feeling, subfeeling] = await Promise.all([
    retrieveStorefrontFeeling(req.scope, req.params.slug),
    retrieveStorefrontSubfeeling(req.scope, req.params.subfeelingSlug),
  ])

  if (!feeling) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Storefront feeling "${req.params.slug}" was not found`)
  }

  if (!subfeeling || subfeeling.feelingSlug !== feeling.slug) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Storefront subfeeling "${req.params.subfeelingSlug}" was not found under "${req.params.slug}"`
    )
  }

  res.status(200).json({ feeling, subfeeling })
}
