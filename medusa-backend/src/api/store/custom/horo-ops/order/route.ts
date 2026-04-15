import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { assertOpsBackendAccess } from "../../../../../lib/horo-ops-backend-auth"
import { ORDER_OPS_ACTION_GRAPH_FIELDS } from "../../../../../lib/horo-ops-order-query-fields"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  if (!assertOpsBackendAccess(req, res)) return

  const rawId = req.query.order_id
  const orderId =
    typeof rawId === "string"
      ? rawId.trim()
      : Array.isArray(rawId)
        ? String(rawId[0] ?? "").trim()
        : ""

  if (!orderId) {
    res.status(400).json({ message: "order_id is required" })
    return
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  try {
    const { data } = await query.graph({
      entity: "order",
      fields: [...ORDER_OPS_ACTION_GRAPH_FIELDS],
      filters: { id: orderId },
      pagination: { take: 1 },
    })
    const row = (data || [])[0] as Record<string, unknown> | undefined
    if (!row) {
      res.status(404).json({ message: "Order not found" })
      return
    }
    res.status(200).json({ order: row })
  } catch (e) {
    res.status(500).json({ message: e instanceof Error ? e.message : "Query failed" })
  }
}
