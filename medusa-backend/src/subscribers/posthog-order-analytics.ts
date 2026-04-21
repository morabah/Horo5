import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { normalizeGraphOrderForEmail } from "../lib/normalize-graph-order-for-email"
import { ORDER_CONFIRMATION_GRAPH_FIELDS } from "../lib/order-confirmation-graph-fields"
import {
  buildPostHogOrderCompletedPayload,
  sendPostHogCapture,
} from "../lib/posthog-order-analytics"
import { retryWithBackoff } from "../lib/retry-with-backoff"

type OrderPlacedPayload = { id?: string }

export default async function postHogOrderAnalyticsHandler({
  event: { data },
  container,
}: SubscriberArgs<OrderPlacedPayload>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const orderId = typeof data?.id === "string" ? data.id : null
  if (!orderId) {
    logger.warn("[posthog-order-analytics] order.placed payload missing id; skip.")
    return
  }

  const apiKey =
    process.env.POSTHOG_PROJECT_API_KEY?.trim() ||
    process.env.POSTHOG_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim()
  if (!apiKey) {
    logger.info("[posthog-order-analytics] POSTHOG_PROJECT_API_KEY unset; skip server analytics.")
    return
  }

  const host =
    process.env.POSTHOG_HOST?.trim() ||
    process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() ||
    "https://eu.i.posthog.com"

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  let orderRow: Record<string, unknown> | undefined
  try {
    const { data: rows } = await query.graph({
      entity: "order",
      fields: [...ORDER_CONFIRMATION_GRAPH_FIELDS],
      filters: { id: orderId },
      pagination: { take: 1 },
    })
    orderRow = (rows || [])[0] as Record<string, unknown> | undefined
  } catch (e) {
    logger.warn(
      `[posthog-order-analytics] Failed to load order ${orderId}: ${e instanceof Error ? e.message : String(e)}`,
    )
    return
  }

  if (!orderRow) {
    logger.warn(`[posthog-order-analytics] No order row for id ${orderId}`)
    return
  }

  const payload = buildPostHogOrderCompletedPayload(
    normalizeGraphOrderForEmail(orderRow, { storeUrl: null }),
  )
  const attempts = Math.max(1, Math.min(5, parseInt(String(process.env.HORO_SUBSCRIBER_HTTP_RETRIES ?? "3"), 10) || 3))
  const result = await retryWithBackoff(
    `[posthog-order-analytics] order=${orderId}`,
    attempts,
    () => sendPostHogCapture({ apiKey, host, payload }),
    (r) => r.ok,
    logger,
  )

  if (!result?.ok) {
    logger.warn(
      `[posthog-order-analytics] PostHog capture failed for order ${orderId}: ${result?.status ?? "unknown"} ${result?.error ?? ""}`.trim(),
    )
    return
  }

  logger.info(`[posthog-order-analytics] Captured commerce_order_completed for order ${orderId}`)
}

export const config: SubscriberConfig = {
  event: "order.placed",
  context: {
    subscriberId: "posthog-order-analytics",
  },
}
