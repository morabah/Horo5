import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateCartWorkflow } from "@medusajs/medusa/core-flows"

import { medusaAmountToEgp } from "../../../../../lib/egp-amount"
import {
  getShippingGovernorate,
  shippingEgpForGovernorate,
} from "../../../../../lib/storefront/shipping-governorates"

type QueryCart = {
  id: string
  metadata?: Record<string, unknown> | null
  subtotal?: number
  item_subtotal?: number
}

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
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization")
  res.setHeader("Access-Control-Allow-Credentials", "true")
  res.setHeader("Access-Control-Max-Age", "300")
}

function cartSubtotalEgp(cart: QueryCart): number {
  return medusaAmountToEgp(cart.item_subtotal ?? cart.subtotal ?? 0)
}

export async function OPTIONS(req: MedusaRequest, res: MedusaResponse) {
  applyStorefrontCors(req, res)
  res.status(204).end()
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  applyStorefrontCors(req, res)
  const cartId = String(req.params.cartId || "").trim()
  const body = (req.body ?? {}) as { governorate?: string }
  const governorate = String(body.governorate || "").trim().toLowerCase()

  if (!cartId) {
    return res.status(400).json({ message: "cartId is required" })
  }
  if (!getShippingGovernorate(governorate)) {
    return res.status(400).json({ message: "Invalid governorate code" })
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: carts } = await query.graph({
    entity: "cart",
    fields: ["id", "metadata", "subtotal", "item_subtotal"],
    filters: { id: cartId },
  })
  const cart = (carts?.[0] as QueryCart | undefined) ?? null
  if (!cart) {
    return res.status(404).json({ message: "Cart not found" })
  }

  const shippingEgp = shippingEgpForGovernorate(governorate)
  const subtotalEgp = cartSubtotalEgp(cart)
  const estimatedTotalEgp = subtotalEgp + shippingEgp

  const metadata = {
    ...(cart.metadata ?? {}),
    deliveryGovernorate: governorate,
    estimatedShippingEgp: shippingEgp,
  }

  await updateCartWorkflow(req.scope).run({
    input: {
      id: cartId,
      metadata,
    },
  })

  res.status(200).json({
    subtotalEgp,
    shippingEgp,
    estimatedTotalEgp,
    governorate,
  })
}
