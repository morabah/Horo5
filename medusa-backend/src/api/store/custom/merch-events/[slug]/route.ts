import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  retrieveStorefrontMerchEvent,
  buildStorefrontCatalog,
} from "../../../../../lib/storefront/catalog"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const slug = (req.params?.slug as string | undefined) || ""

  if (!slug) {
    res.status(400).json({ ok: false, error: "Slug is required." })
    return
  }

  const event = await retrieveStorefrontMerchEvent(req.scope, slug)

  if (!event || !event.active) {
    res.status(404).json({ ok: false, error: "Campaign not found." })
    return
  }

  const catalog = await buildStorefrontCatalog(req.scope)
  const products = catalog.products.filter((p) =>
    event.productHandles.includes(p.slug)
  )

  res.status(200).json({
    ok: true,
    event,
    products,
  })
}
