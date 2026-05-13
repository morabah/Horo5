import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateOrderWorkflow } from "@medusajs/medusa/core-flows"

import { buildInitialCodConfirmationMetadata } from "../lib/cod-confirmation"
import { ORDER_OPS_PAYMENT_DETECT_FIELDS } from "../lib/horo-ops-order-query-fields"
import { asRecord } from "../lib/shared/type-guards"

type OrderPlacedPayload = { id?: string }

export default async function codConfirmationStatusHandler({
  event: { data },
  container,
}: SubscriberArgs<OrderPlacedPayload>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const orderId = typeof data?.id === "string" ? data.id : null
  if (!orderId) {
    logger.warn("[cod-confirmation-status] order.placed payload missing id; skip.")
    return
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  let orderRow: Record<string, unknown> | undefined
  try {
    const { data: rows } = await query.graph({
      entity: "order",
      fields: ["id", "metadata", ...ORDER_OPS_PAYMENT_DETECT_FIELDS],
      filters: { id: orderId },
      pagination: { take: 1 },
    })
    const row = (rows || [])[0]
    orderRow = row && typeof row === "object" ? (row as Record<string, unknown>) : undefined
  } catch (e) {
    logger.warn(`[cod-confirmation-status] Failed to load order ${orderId}: ${e instanceof Error ? e.message : String(e)}`)
    return
  }

  if (!orderRow) {
    logger.warn(`[cod-confirmation-status] No order row for id ${orderId}`)
    return
  }

  const currentMetadata = asRecord(orderRow.metadata)
  if (currentMetadata.codConfirmationStatus) {
    return
  }

  const codMetadata = buildInitialCodConfirmationMetadata(orderRow)
  await updateOrderWorkflow(container).run({
    input: {
      id: orderId,
      user_id: "horo_cod_confirmation",
      metadata: {
        ...currentMetadata,
        ...codMetadata,
      },
    } as never,
  })
}

export const config: SubscriberConfig = {
  event: "order.placed",
  context: {
    subscriberId: "cod-confirmation-status",
  },
}
