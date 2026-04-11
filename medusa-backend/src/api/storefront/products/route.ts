import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { filterStorefrontProductsByQuery, listStorefrontProducts } from "../../../lib/storefront/catalog"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const products = await listStorefrontProducts(req.scope)
  const category = typeof req.query.category === "string" ? req.query.category : undefined
  const decoration = typeof req.query.decoration === "string" ? req.query.decoration : undefined
  const occasion = typeof req.query.occasion === "string" ? req.query.occasion : undefined

  const filtered =
    category || decoration || occasion
      ? filterStorefrontProductsByQuery(products, { category, decoration, occasion })
      : products

  res.status(200).json({ products: filtered })
}
