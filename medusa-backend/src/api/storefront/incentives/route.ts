import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { retrieveStorefrontIncentivesPayload } from "../../../lib/storefront/incentives"

/**
 * Apply storefront CORS headers so browser fetch() from the storefront works.
 * Duplicates the storefrontCors middleware in middlewares.ts as a belt-and-suspenders
 * fix — Medusa v2 may not route OPTIONS preflight requests through custom middlewares
 * for /storefront/* routes that lack an explicit OPTIONS handler.
 */
function applyStorefrontCors(req: MedusaRequest, res: MedusaResponse): void {
  const origin = req.headers.origin || ""
  const storeCors = String(process.env.STORE_CORS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  const allowed = storeCors.length > 0 ? storeCors : ["*"]
  const isAllowed = allowed.includes(origin) || allowed.includes("*")

  if (isAllowed) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*")
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization")
  res.setHeader("Access-Control-Allow-Credentials", "true")
  res.setHeader("Access-Control-Max-Age", "300")
}

/**
 * Handle CORS preflight for the incentives endpoint.
 * Without this, the browser blocks the actual GET because the custom
 * storefrontCors middleware may not intercept OPTIONS on this route.
 */
export async function OPTIONS(req: MedusaRequest, res: MedusaResponse) {
  applyStorefrontCors(req, res)
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=900")
  res.status(204).end()
}

/**
 * Public storefront incentives projection.
 * Reads native Medusa Promotions (automatic + active) plus the gift-wrap product handle
 * and returns display-only labels. The cart math itself stays inside Medusa.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  applyStorefrontCors(req, res)
  const payload = await retrieveStorefrontIncentivesPayload(req.scope)
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=900")
  res.status(200).json(payload)
}
