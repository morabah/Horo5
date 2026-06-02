import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { SHIPPING_GOVERNORATES } from "../../../../lib/storefront/shipping-governorates"

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

export async function OPTIONS(req: MedusaRequest, res: MedusaResponse) {
  applyStorefrontCors(req, res)
  res.status(204).end()
}

/** Public governorate shipping table for cart/checkout estimates. */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  applyStorefrontCors(req, res)
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=900")
  res.status(200).json({
    governorates: SHIPPING_GOVERNORATES.map((row) => ({
      code: row.code,
      label: { en: row.label_en, ar: row.label_ar },
      shippingEgp: row.price_egp,
    })),
  })
}
