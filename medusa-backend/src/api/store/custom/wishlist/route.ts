import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { STOREFRONT_WISHLIST_MODULE } from "../../../../modules/storefront-wishlist"
import type StorefrontWishlistModuleService from "../../../../modules/storefront-wishlist/service"

const CLIENT_HEADER = "x-horo-wishlist-client"

function readClientId(req: MedusaRequest): string | null {
  const raw = req.headers[CLIENT_HEADER] ?? req.headers[CLIENT_HEADER.toLowerCase()]
  const value = Array.isArray(raw) ? raw[0] : raw
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length >= 8 && trimmed.length <= 128 ? trimmed : null
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const clientId = readClientId(req)
  if (!clientId) {
    res.status(400).json({ ok: false, error: "Missing or invalid wishlist client id header." })
    return
  }

  const service = req.scope.resolve<StorefrontWishlistModuleService>(STOREFRONT_WISHLIST_MODULE)
  const rows = await service.listStorefrontWishlists({ client_id: clientId }, { take: 200 })
  res.status(200).json({
    ok: true,
    slugs: rows.map((row) => row.product_slug),
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const clientId = readClientId(req)
  if (!clientId) {
    res.status(400).json({ ok: false, error: "Missing or invalid wishlist client id header." })
    return
  }

  const body = (req.body || {}) as Record<string, unknown>
  const productSlug = typeof body.product_slug === "string" ? body.product_slug.trim() : ""
  const productId = typeof body.product_id === "string" ? body.product_id.trim() : null

  if (!productSlug) {
    res.status(400).json({ ok: false, error: "product_slug is required." })
    return
  }

  const service = req.scope.resolve<StorefrontWishlistModuleService>(STOREFRONT_WISHLIST_MODULE)
  const existing = await service.listStorefrontWishlists(
    { client_id: clientId, product_slug: productSlug },
    { take: 1 }
  )

  if (existing.length === 0) {
    await service.createStorefrontWishlists({
      client_id: clientId,
      product_slug: productSlug,
      product_id: productId,
    })
  }

  res.status(200).json({ ok: true })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const clientId = readClientId(req)
  if (!clientId) {
    res.status(400).json({ ok: false, error: "Missing or invalid wishlist client id header." })
    return
  }

  const body = (req.body || {}) as Record<string, unknown>
  const productSlug = typeof body.product_slug === "string" ? body.product_slug.trim() : ""

  if (!productSlug) {
    res.status(400).json({ ok: false, error: "product_slug is required." })
    return
  }

  const service = req.scope.resolve<StorefrontWishlistModuleService>(STOREFRONT_WISHLIST_MODULE)
  const existing = await service.listStorefrontWishlists(
    { client_id: clientId, product_slug: productSlug },
    { take: 1 }
  )

  if (existing[0]?.id) {
    await service.deleteStorefrontWishlists(existing[0].id)
  }

  res.status(200).json({ ok: true })
}
