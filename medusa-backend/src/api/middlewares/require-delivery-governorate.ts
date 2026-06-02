import type { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { assertCartHasDeliveryGovernorate } from "../../lib/storefront/shipping-governorates"

type QueryCart = {
  id: string
  metadata?: Record<string, unknown> | null
}

async function loadCartMetadata(req: MedusaRequest, cartId: string): Promise<Record<string, unknown> | null> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: carts } = await query.graph({
    entity: "cart",
    fields: ["id", "metadata"],
    filters: { id: cartId },
  })
  const cart = (carts?.[0] as QueryCart | undefined) ?? null
  return cart?.metadata ?? null
}

function cartIdFromPaymentSessionBody(body: unknown): string | null {
  if (!body || typeof body !== "object") return null
  const record = body as Record<string, unknown>
  const data = record.data
  if (data && typeof data === "object") {
    const cartId = (data as Record<string, unknown>).cart_id
    if (typeof cartId === "string" && cartId.trim()) return cartId.trim()
  }
  const cartId = record.cart_id
  if (typeof cartId === "string" && cartId.trim()) return cartId.trim()
  return null
}

/** Backend safety: block checkout payment session / complete without delivery governorate on cart metadata. */
export async function requireDeliveryGovernorate(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
) {
  try {
    const path = (req as { originalUrl?: string }).originalUrl ?? req.url ?? ""
    let cartId: string | null = null

    if (/\/store\/carts\/[^/]+\/complete\b/i.test(path)) {
      const match = path.match(/\/store\/carts\/([^/]+)\/complete\b/i)
      cartId = match?.[1] ?? null
    } else if (/\/store\/payment-collections\/[^/]+\/payment-sessions\b/i.test(path)) {
      cartId = cartIdFromPaymentSessionBody(req.body)
    }

    if (!cartId) {
      next()
      return
    }

    const metadata = await loadCartMetadata(req, cartId)
    assertCartHasDeliveryGovernorate(metadata)
    next()
  } catch (error) {
    const message = error instanceof Error ? error.message : "Governorate required before checkout."
    const status =
      error instanceof Error && "statusCode" in error && typeof (error as { statusCode?: number }).statusCode === "number"
        ? (error as { statusCode: number }).statusCode
        : 400
    res.status(status).json({ message })
  }
}
