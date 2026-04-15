import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  aggregateFeelingFacetsFromProducts,
  filterStorefrontProductsByQuery,
  getStorefrontCatalogWithServerCache,
} from "../../../lib/storefront/catalog"
import { isStorefrontPgSearchEnabled, searchStorefrontProductHandlesBySubstring } from "../../../lib/storefront/pg-search-handles"

/**
 * Server-side catalog search (filters Medusa-backed storefront products).
 * Default: in-memory substring match over the cached catalog.
 * Set `STOREFRONT_PG_SEARCH=1` and run the `Migration20260415120000_storefront_search_trgm` migration to use Postgres (trigram-backed `LIKE`) for the `q` filter.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const q = typeof req.query.q === "string" ? req.query.q.trim().toLowerCase() : ""
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
      (product) => product.primaryFeelingSlug === feeling || product.feelingSlug === feeling
    )
  }

  if (q) {
    if (isStorefrontPgSearchEnabled()) {
      try {
        const handles = await searchStorefrontProductHandlesBySubstring(q)
        if (handles.size > 0) {
          products = products.filter((product) => handles.has(product.slug))
        } else {
          products = []
        }
      } catch {
        products = products.filter((product) => {
          const hay = `${product.name} ${product.story} ${product.slug}`.toLowerCase()
          return hay.includes(q)
        })
      }
    } else {
      products = products.filter((product) => {
        const hay = `${product.name} ${product.story} ${product.slug}`.toLowerCase()
        return hay.includes(q)
      })
    }
  }

  const pageRaw = typeof req.query.page === "string" ? Number(req.query.page) : 1
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1
  const pageSizeRaw = typeof req.query.pageSize === "string" ? Number(req.query.pageSize) : 24
  const pageSize = Math.min(500, Math.max(1, Number.isFinite(pageSizeRaw) ? Math.floor(pageSizeRaw) : 24))
  const start = (page - 1) * pageSize
  const slice = products.slice(start, start + pageSize)

  const facets = aggregateFeelingFacetsFromProducts(products)

  res.status(200).json({
    products: slice,
    page,
    pageSize,
    total: products.length,
    facets,
  })
}
