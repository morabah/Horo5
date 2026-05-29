import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateOrderWorkflow } from "@medusajs/medusa/core-flows"

import {
  buildPendingUgcRequestMetadata,
  deliveredAtFromOrder,
  readMetadata,
} from "../lib/post-delivery-ugc"

type FulfillmentDeliveredPayload = {
  id?: string
  order_id?: string
  orderId?: string
  delivered_at?: string
  deliveredAt?: string
}

const ORDER_DELIVERED_UGC_FIELDS = [
  "id",
  "metadata",
  "fulfillment_status",
  "fulfillments.*",
] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" && typeof value !== "number" && !(value instanceof Date)) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function resolveOrderId(data: unknown): string | null {
  if (!isRecord(data)) return null

  const direct = data.order_id ?? data.orderId
  if (typeof direct === "string" && direct.trim()) return direct.trim()

  const nestedOrder = isRecord(data.order) ? data.order.id : null
  if (typeof nestedOrder === "string" && nestedOrder.trim()) return nestedOrder.trim()

  const id = typeof data.id === "string" ? data.id.trim() : ""
  return id.startsWith("order_") ? id : null
}

export default async function postDeliveryUgcScheduleHandler({
  event: { data },
  container,
}: SubscriberArgs<FulfillmentDeliveredPayload>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const orderId = resolveOrderId(data)
  if (!orderId) {
    logger.warn("[post-delivery-ugc-schedule] fulfillment delivered payload missing order id; skip.")
    return
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  let orderRow: Record<string, unknown> | undefined
  try {
    const { data: rows } = await query.graph({
      entity: "order",
      fields: [...ORDER_DELIVERED_UGC_FIELDS] as string[],
      filters: { id: orderId },
      pagination: { take: 1 },
    })
    const row = (rows || [])[0]
    orderRow = row && typeof row === "object" ? (row as Record<string, unknown>) : undefined
  } catch (e) {
    logger.warn(
      `[post-delivery-ugc-schedule] Failed to load order ${orderId}: ${e instanceof Error ? e.message : String(e)}`,
    )
    return
  }

  if (!orderRow) {
    logger.warn(`[post-delivery-ugc-schedule] No order row for id ${orderId}`)
    return
  }

  const eventDeliveredAt = isRecord(data) ? parseDate(data.delivered_at ?? data.deliveredAt) : null
  const metadata = buildPendingUgcRequestMetadata({
    existingMetadata: readMetadata(orderRow.metadata),
    deliveredAt: eventDeliveredAt ?? deliveredAtFromOrder(orderRow),
  })

  await updateOrderWorkflow(container).run({
    input: {
      id: orderId,
      user_id: "horo_post_delivery_ugc_schedule",
      metadata,
    } as never,
  })

  logger.info(`[post-delivery-ugc-schedule] Scheduled post-delivery UGC request for order ${orderId}`)
}

export const config: SubscriberConfig = {
  event: "order.fulfillment_delivered",
  context: {
    subscriberId: "post-delivery-ugc-schedule",
  },
}
