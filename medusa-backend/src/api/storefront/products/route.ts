import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { filterStorefrontProductsByQuery, getStorefrontCatalogWithServerCache } from "../../../lib/storefront/catalog"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const catalog = await getStorefrontCatalogWithServerCache(req.scope)
  const category = typeof req.query.category === "string" ? req.query.category : undefined
  const decoration = typeof req.query.decoration === "string" ? req.query.decoration : undefined
  const occasion = typeof req.query.occasion === "string" ? req.query.occasion : undefined

  const filtered =
    category || decoration || occasion
      ? filterStorefrontProductsByQuery(catalog.products, { category, decoration, occasion })
      : catalog.products

  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300")
  res.status(200).json({ products: filtered })
}
