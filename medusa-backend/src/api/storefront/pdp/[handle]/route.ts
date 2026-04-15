import { MedusaError } from "@medusajs/framework/utils"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { retrieveStorefrontPdpPayload } from "../../../../lib/storefront/catalog"
import { storefrontPdpResponseSchema } from "../../../../lib/storefront/dto"

export async function GET(req: MedusaRequest<{ handle: string }>, res: MedusaResponse) {
  const payload = await retrieveStorefrontPdpPayload(req.scope, req.params.handle)

  if (!payload) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Storefront PDP "${req.params.handle}" was not found`)
  }

  const body = {
    product: payload.product,
    settings: payload.settings,
    crossSellProducts: payload.crossSellProducts,
  }

  const parsed = storefrontPdpResponseSchema.safeParse(body)
  if (!parsed.success) {
    const detail = parsed.error.flatten()
    if (process.env.NODE_ENV !== "production") {
      console.warn("[storefront/pdp] DTO validation warning", detail)
    }
  }

  res.status(200).json(body)
}
