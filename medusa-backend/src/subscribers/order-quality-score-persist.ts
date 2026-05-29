import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateOrderWorkflow } from "@medusajs/medusa/core-flows"

import { ORDER_OPS_ACTION_GRAPH_FIELDS } from "../lib/horo-ops-order-query-fields"
import { calculateOrderQualityScore } from "../lib/order-quality-score"
import { asRecord } from "../lib/shared/type-guards"

type OrderPlacedPayload = { id?: string }

const ORDER_QUALITY_GRAPH_FIELDS = [
  ...ORDER_OPS_ACTION_GRAPH_FIELDS,
  "items.item.product.*",
  "items.item.variant.*",
] as const

export default async function orderQualityScorePersistHandler({
  event: { data },
  container,
}: SubscriberArgs<OrderPlacedPayload>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const orderId = typeof data?.id === "string" ? data.id : null
  if (!orderId) {
    logger.warn("[order-quality-score-persist] order.placed payload missing id; skip.")
    return
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  let orderRow: Record<string, unknown> | undefined
  try {
    const { data: rows } = await query.graph({
      entity: "order",
      fields: [...ORDER_QUALITY_GRAPH_FIELDS] as string[],
      filters: { id: orderId },
      pagination: { take: 1 },
    })
    const row = (rows || [])[0]
    orderRow = row && typeof row === "object" ? (row as Record<string, unknown>) : undefined
  } catch (e) {
    logger.warn(
      `[order-quality-score-persist] Failed to load order ${orderId}: ${e instanceof Error ? e.message : String(e)}`,
    )
    return
  }

  if (!orderRow) {
    logger.warn(`[order-quality-score-persist] No order row for id ${orderId}`)
    return
  }

  const currentMetadata = asRecord(orderRow.metadata)
  if (currentMetadata.quality_score != null && currentMetadata.quality_breakdown != null) {
    return
  }

  const quality = calculateOrderQualityScore(orderRow)

  await updateOrderWorkflow(container).run({
    input: {
      id: orderId,
      user_id: "horo_quality_score",
      metadata: {
        ...currentMetadata,
        quality_score: quality.orderQualityScore,
        quality_breakdown: quality.scoreBreakdown,
        quality_warnings: quality.warnings,
        contribution_margin_egp: quality.contributionMargin.contributionMarginEgp,
      },
    } as never,
  })

  logger.info(
    `[order-quality-score-persist] Wrote score ${quality.orderQualityScore} to order ${orderId}`,
  )
}

export const config: SubscriberConfig = {
  event: "order.placed",
  context: {
    subscriberId: "order-quality-score-persist",
  },
}
