import { MedusaError } from "@medusajs/framework/utils"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { retrieveStorefrontPdpPayload } from "../../../../lib/storefront/catalog"
import { storefrontPdpResponseSchema } from "../../../../lib/storefront/dto"

export async function GET(req: MedusaRequest<{ handle: string }>, res: MedusaResponse) {
  const previewRequested = req.query.preview === "1" || req.query.preview === "true"
  const previewEnabled = String(process.env.HORO_STOREFRONT_DRAFT_PREVIEW || "").trim() === "1"
  // In non-production, always allow drafts when preview is requested.
  // In production, require HORO_STOREFRONT_DRAFT_PREVIEW=1 to enable.
  const includeDrafts = previewRequested && (previewEnabled || process.env.NODE_ENV !== "production")
  const payload = await retrieveStorefrontPdpPayload(req.scope, req.params.handle, { includeDrafts, bypassCache: previewRequested })

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

  res.setHeader("Cache-Control", previewRequested ? "no-store" : "public, s-maxage=60, stale-while-revalidate=300")
  res.status(200).json(body)
}
