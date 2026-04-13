import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

type CheckoutStatus = "pending" | "authorized" | "completed" | "failed"

type QueryCart = {
  completed_at?: string | null
  id: string
  payment_collection?: {
    payment_sessions?: Array<{
      provider_id?: string | null
      status?: string | null
    } | null> | null
    status?: string | null
  } | null
}

type QueryOrder = {
  order_id: string
}

const AUTHORIZED_SESSION_STATUSES = new Set(["authorized", "captured"])
const FAILED_SESSION_STATUSES = new Set(["error", "canceled"])
const AUTHORIZED_COLLECTION_STATUSES = new Set([
  "authorized",
  "partially_authorized",
  "completed",
])
const FAILED_COLLECTION_STATUSES = new Set(["failed", "canceled"])

function resolveCheckoutStatus(cart: QueryCart): CheckoutStatus {
  const paymentCollectionStatus =
    cart.payment_collection?.status?.toLowerCase() || ""
  const paymentSessions =
    cart.payment_collection?.payment_sessions?.flatMap((session) =>
      session ? [session] : []
    ) || []
  const sessionStatuses = paymentSessions
    .map((session) => session.status?.toLowerCase() || "")
    .filter(Boolean)

  if (AUTHORIZED_COLLECTION_STATUSES.has(paymentCollectionStatus)) {
    return "authorized"
  }

  if (FAILED_COLLECTION_STATUSES.has(paymentCollectionStatus)) {
    return "failed"
  }

  if (sessionStatuses.some((status) => AUTHORIZED_SESSION_STATUSES.has(status))) {
    return "authorized"
  }

  if (sessionStatuses.some((status) => FAILED_SESSION_STATUSES.has(status))) {
    return "failed"
  }

  if (cart.completed_at) {
    return "authorized"
  }

  return "pending"
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve("query")
  const cartId = String(req.query.cart_id || "").trim()

  if (!cartId) {
    return res.status(400).json({ error: "cart_id is required" })
  }

  try {
    const { data: carts } = await query.graph({
      entity: "cart",
      fields: [
        "id",
        "completed_at",
        "payment_collection.id",
        "payment_collection.status",
        "payment_collection.payment_sessions.id",
        "payment_collection.payment_sessions.provider_id",
        "payment_collection.payment_sessions.status",
      ],
      filters: { id: cartId },
    })

    const cart = (carts?.[0] as QueryCart | undefined) ?? null

    if (!cart) {
      return res.status(404).json({ error: "Cart not found" })
    }

    const { data: orders } = await query.graph({
      entity: "order_cart",
      fields: ["order_id"],
      filters: { cart_id: cartId },
      pagination: { take: 1 },
    })

    const order = (orders?.[0] as QueryOrder | undefined) ?? null

    if (order) {
      return res.json({ order_id: order.order_id, status: "completed" satisfies CheckoutStatus })
    }

    return res.json({ status: resolveCheckoutStatus(cart) })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to resolve checkout status."

    return res.status(500).json({ error: message })
  }
}
