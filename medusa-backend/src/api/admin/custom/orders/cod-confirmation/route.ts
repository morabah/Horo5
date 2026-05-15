import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateOrderWorkflow } from "@medusajs/medusa/core-flows"

import {
  COD_CONFIRMATION_STATUSES,
  buildCodConfirmationUpdate,
  isCodConfirmationStatus,
  type CodConfirmationStatus,
  type CodConfirmedBy,
} from "../../../../../lib/cod-confirmation"
import { assertTaxonomyAdminWrite } from "../../taxonomy-auth"

/**
 * POST /admin/custom/orders/cod-confirmation
 * POST /admin/custom/orders/:id/cod-confirmation (alias)
 *
 * Body:
 *   - order_id: string (required only on the non-dynamic route)
 *   - status: CodConfirmationStatus (required)
 *   - confirmed_by: "whatsapp" | "manual_admin" (optional, defaults to "manual_admin")
 *
 * Updates the COD confirmation metadata on an order.
 */
export async function POST(
  req: MedusaRequest<{ status: string; confirmed_by?: string }>,
  res: MedusaResponse,
) {
  if (!assertTaxonomyAdminWrite(req, res)) {
    return
  }

  const body = (req.body || {}) as Record<string, unknown>
  const orderId =
    (req.params?.id as string | undefined) ||
    (typeof body.order_id === "string" ? body.order_id.trim() : undefined) ||
    (typeof body.orderId === "string" ? body.orderId.trim() : undefined)
  if (!orderId) {
    res.status(400).json({ message: "Missing order id. Use /orders/:id/cod-confirmation or provide body.order_id." })
    return
  }

  const nextStatus = body.status
  if (!isCodConfirmationStatus(nextStatus)) {
    res.status(400).json({
      message: `Invalid status. Must be one of: ${COD_CONFIRMATION_STATUSES.join(", ")}`,
    })
    return
  }

  const confirmedBy: CodConfirmedBy | undefined =
    body.confirmed_by === "whatsapp" || body.confirmed_by === "manual_admin"
      ? body.confirmed_by
      : undefined

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: rows } = await query.graph({
    entity: "order",
    fields: ["id", "metadata"],
    filters: { id: orderId },
    pagination: { take: 1 },
  })

  const orderRow = (rows ?? [])[0] as Record<string, unknown> | undefined
  if (!orderRow) {
    res.status(404).json({ message: "Order not found." })
    return
  }

  const currentMeta =
    orderRow.metadata && typeof orderRow.metadata === "object" && !Array.isArray(orderRow.metadata)
      ? (orderRow.metadata as Record<string, unknown>)
      : {}

  const codUpdate = buildCodConfirmationUpdate(currentMeta, nextStatus as CodConfirmationStatus, {
    confirmedBy,
  })

  await updateOrderWorkflow(req.scope).run({
    input: {
      id: orderId,
      user_id: "horo_admin_cod_update",
      metadata: {
        ...currentMeta,
        ...codUpdate,
      },
    },
  })

  res.status(200).json({
    order_id: orderId,
    cod_confirmation: codUpdate,
  })
}
