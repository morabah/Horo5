import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  aggregateFeelingFacetsFromProducts,
  filterStorefrontProductsByQuery,
  getStorefrontCatalogWithServerCache,
} from "../../../lib/storefront/catalog"

/**
 * Facet counts for the storefront catalog (same scoping filters as `/storefront/search`, without `q`).
 * Use this to drive filter UI without pulling a full product page.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const feeling = typeof req.query.feeling === "string" ? req.query.feeling.trim() : ""
  const category = typeof req.query.category === "string" ? req.query.category.trim().toLowerCase() : ""
  const decoration =
    typeof req.query.decoration === "string" && req.query.decoration.trim()
      ? req.query.decoration.trim().toLowerCase()
      : undefined
  const occasion = typeof req.query.occasion === "string" ? req.query.occasion.trim() : ""

  const catalog = await getStorefrontCatalogWithServerCache(req.scope)
  let products = catalog.products

  products = filterStorefrontProductsByQuery(products, {
    category: category || undefined,
    decoration,
    occasion: occasion || undefined,
  })

  if (feeling) {
    products = products.filter(
      (product) => product.primaryFeelingSlug === feeling || product.feelingSlug === feeling,
    )
  }

  const facets = aggregateFeelingFacetsFromProducts(products)

  res.status(200).json({
    total: products.length,
    facets,
  })
}
