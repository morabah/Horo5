import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { readCodConfirmationMetadata } from "../../../../../lib/cod-confirmation"
import { ORDER_OPS_PAYMENT_DETECT_FIELDS } from "../../../../../lib/horo-ops-order-query-fields"

/**
 * GET /admin/custom/orders/cod-confirmation-queue
 *
 * Query params:
 *   - status: "pending" | "confirmed" | "failed" | "unreachable" | "all" (default: "pending")
 *   - skip: number (default: 0)
 *   - take: number (default: 50, max: 200)
 *
 * Returns COD orders filtered by confirmation status for the admin queue UI.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const rawStatus = typeof req.query.status === "string" ? req.query.status.trim().toLowerCase() : "pending"
  const statusFilter = ["pending", "confirmed", "failed", "unreachable", "all"].includes(rawStatus)
    ? rawStatus
    : "pending"

  const skip = Math.max(0, parseInt(String(req.query.skip ?? "0"), 10) || 0)
  const take = Math.min(200, Math.max(1, parseInt(String(req.query.take ?? "50"), 10) || 50))

  try {
    const { data: rows } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "email",
        "status",
        "metadata",
        "total",
        "currency_code",
        "shipping_address.*",
        "created_at",
        ...ORDER_OPS_PAYMENT_DETECT_FIELDS,
      ],
      filters: {},
      pagination: { skip: 0, take: 1000 },
    })

    const orders = (rows ?? []) as Array<Record<string, unknown>>

    const withCodMeta = orders.map((order) => {
      const meta =
        order.metadata && typeof order.metadata === "object" && !Array.isArray(order.metadata)
          ? (order.metadata as Record<string, unknown>)
          : {}
      const cod = readCodConfirmationMetadata({ metadata: meta, ...order })
      const shipping = order.shipping_address as Record<string, unknown> | undefined
      return {
        id: order.id,
        display_id: order.display_id,
        email: order.email,
        status: order.status,
        cod_confirmation_status: cod.codConfirmationStatus,
        cod_confirmed_at: cod.codConfirmedAt ?? null,
        cod_confirmed_by: cod.codConfirmedBy ?? null,
        cod_attempts: cod.codConfirmationAttempts,
        total: order.total,
        currency_code: order.currency_code,
        shipping_address: {
          first_name: shipping?.first_name,
          last_name: shipping?.last_name,
          phone: shipping?.phone,
          city: shipping?.city,
        },
        created_at: order.created_at,
      }
    })

    const filtered =
      statusFilter === "all"
        ? withCodMeta.filter((o) => o.cod_confirmation_status !== "not_required")
        : withCodMeta.filter((o) => o.cod_confirmation_status === statusFilter)

    const paged = filtered.slice(skip, skip + take)

    res.status(200).json({
      status: statusFilter,
      total: filtered.length,
      skip,
      take,
      orders: paged,
    })
  } catch (e) {
    logger.warn(
      `[cod-confirmation-queue] Failed to load orders: ${e instanceof Error ? e.message : String(e)}`,
    )
    res.status(500).json({
      error: "Failed to load COD confirmation queue",
      detail: e instanceof Error ? e.message : String(e),
    })
  }
}
