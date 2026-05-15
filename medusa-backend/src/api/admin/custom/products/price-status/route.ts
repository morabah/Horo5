import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"

const VALID_PRICE_STATUSES = ["hypothesis", "validated"] as const
type PriceStatus = (typeof VALID_PRICE_STATUSES)[number]

function isValidPriceStatus(value: unknown): value is PriceStatus {
  return typeof value === "string" && (VALID_PRICE_STATUSES as readonly string[]).includes(value)
}

/**
 * PATCH /admin/custom/products/price-status
 * Body: { productIds: string[], priceStatus: "hypothesis" | "validated" }
 *
 * Bulk-toggle the price-as-hypothesis flag on one or more products.
 * Writes `metadata.price_status` so the storefront can badge hypothesis-priced items.
 */
export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body ?? {}) as Record<string, unknown>
  const productIds = Array.isArray(body.productIds) ? (body.productIds as string[]).filter((id) => typeof id === "string") : []
  const priceStatus = body.priceStatus

  if (productIds.length === 0) {
    res.status(400).json({ error: "productIds array is required" })
    return
  }

  if (!isValidPriceStatus(priceStatus)) {
    res.status(400).json({ error: "priceStatus must be 'hypothesis' or 'validated'" })
    return
  }

  const results = { updated: [] as string[], failed: [] as string[] }

  for (const productId of productIds) {
    try {
      await updateProductsWorkflow(req.scope).run({
        input: {
          selector: { id: [productId] },
          update: {
            metadata: {
              price_status: priceStatus,
            },
          },
        } as never,
      })
      results.updated.push(productId)
    } catch {
      results.failed.push(productId)
    }
  }

  res.status(200).json({
    priceStatus,
    updatedCount: results.updated.length,
    failedCount: results.failed.length,
    updated: results.updated,
    failed: results.failed,
  })
}

/**
 * GET /admin/custom/products/price-status?ids=id1,id2
 *
 * Reads the current `price_status` metadata for the requested product IDs.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const rawIds = req.query.ids
  const ids =
    typeof rawIds === "string"
      ? rawIds.split(",").map((s) => s.trim()).filter(Boolean)
      : []

  if (ids.length === 0) {
    res.status(400).json({ error: "?ids query param is required (comma-separated)" })
    return
  }

  const query = req.scope.resolve("query")
  const { data: rows } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "metadata"],
    filters: { id: ids },
    pagination: { take: ids.length },
  })

  const products = ((rows ?? []) as Array<Record<string, unknown>>).map((row) => {
    const metadata =
      row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>)
        : {}
    return {
      id: row.id,
      handle: row.handle,
      priceStatus: metadata.price_status ?? null,
    }
  })

  res.status(200).json({ products })
}
