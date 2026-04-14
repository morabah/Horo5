import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import {
  buildOrderConfirmationHtml,
  sendOrderConfirmationResend,
  type OrderConfirmationInput,
} from "../lib/order-confirmation-email"

type OrderPlacedPayload = { id?: string }

const ORDER_GRAPH_FIELDS = [
  "id",
  "display_id",
  "email",
  "currency_code",
  "created_at",
  "subtotal",
  "tax_total",
  "shipping_total",
  "discount_total",
  "total",
  "items.*",
  "shipping_address.*",
  "billing_address.*",
  "shipping_methods.*",
] as const

export default async function orderConfirmationEmailHandler({
  event: { data },
  container,
}: SubscriberArgs<OrderPlacedPayload>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const orderId = typeof data?.id === "string" ? data.id : null
  if (!orderId) {
    logger.warn("[order-confirmation-email] order.placed payload missing id; skip send.")
    return
  }

  const apiKey = process.env.RESEND_API_KEY?.trim()
  const from = process.env.ORDER_CONFIRMATION_FROM?.trim()
  if (!apiKey || !from) {
    logger.info(
      "[order-confirmation-email] RESEND_API_KEY or ORDER_CONFIRMATION_FROM unset; skip confirmation email.",
    )
    return
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  let orderRow: Record<string, unknown> | undefined
  try {
    const { data: rows } = await query.graph({
      entity: "order",
      fields: [...ORDER_GRAPH_FIELDS],
      filters: { id: orderId },
      pagination: { take: 1 },
    })
    orderRow = (rows || [])[0] as Record<string, unknown> | undefined
  } catch (e) {
    logger.warn(
      `[order-confirmation-email] Failed to load order ${orderId}: ${e instanceof Error ? e.message : String(e)}`,
    )
    return
  }

  if (!orderRow) {
    logger.warn(`[order-confirmation-email] No order row for id ${orderId}`)
    return
  }

  const to = typeof orderRow.email === "string" ? orderRow.email.trim() : ""
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    logger.warn(`[order-confirmation-email] Order ${orderId} has no valid customer email; skip send.`)
    return
  }

  const storeUrl = process.env.STORE_URL?.trim() || process.env.STORE_CORS?.split(",")[0]?.trim() || ""
  const bcc = process.env.ORDER_CONFIRMATION_BCC?.trim() || null

  const orderInput: OrderConfirmationInput = {
    ...(orderRow as OrderConfirmationInput),
    storeUrl: storeUrl || null,
  }

  const display =
    typeof orderRow.display_id === "number" && orderRow.display_id > 0
      ? `HORO-${orderRow.display_id}`
      : orderId
  const html = buildOrderConfirmationHtml(orderInput)
  const subject = `Your HORO order ${display} is confirmed`

  const result = await sendOrderConfirmationResend({
    apiKey,
    from,
    to,
    bcc,
    subject,
    html,
  })

  if (!result.ok) {
    logger.warn(`[order-confirmation-email] Resend error for order ${orderId}: ${result.error || "unknown"}`)
    return
  }

  logger.info(`[order-confirmation-email] Sent confirmation to ${to} for order ${orderId}`)
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
