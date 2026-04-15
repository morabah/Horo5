import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { retryWithBackoff } from "../lib/retry-with-backoff"
import {
  buildWhatsAppOrderTemplateBody,
  ORDER_WHATSAPP_GRAPH_FIELDS,
  resolveMetaWhatsAppToFromOrderRow,
  sendWhatsAppOrderConfirmationTemplate,
} from "../lib/whatsapp-cloud-order"

type OrderPlacedPayload = { id?: string }

export default async function whatsappOrderConfirmationHandler({
  event: { data },
  container,
}: SubscriberArgs<OrderPlacedPayload>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const orderId = typeof data?.id === "string" ? data.id : null
  if (!orderId) {
    logger.warn("[whatsapp-order-confirmation] order.placed payload missing id; skip.")
    return
  }

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim()
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim()
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME?.trim()
  const templateLang = (process.env.WHATSAPP_TEMPLATE_LANG || "en").trim()
  const graphVersion = (process.env.META_GRAPH_VERSION || "v23.0").trim()

  if (!accessToken || !phoneNumberId || !templateName) {
    logger.info(
      "[whatsapp-order-confirmation] WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, or WHATSAPP_TEMPLATE_NAME unset; skip WhatsApp.",
    )
    return
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  let orderRow: Record<string, unknown> | undefined
  try {
    const { data: rows } = await query.graph({
      entity: "order",
      fields: [...ORDER_WHATSAPP_GRAPH_FIELDS] as string[],
      filters: { id: orderId },
      pagination: { take: 1 },
    })
    const row = (rows || [])[0]
    orderRow = row && typeof row === "object" ? (row as Record<string, unknown>) : undefined
  } catch (e) {
    logger.warn(
      `[whatsapp-order-confirmation] Failed to load order ${orderId}: ${e instanceof Error ? e.message : String(e)}`,
    )
    return
  }

  if (!orderRow) {
    logger.warn(`[whatsapp-order-confirmation] No order row for id ${orderId}`)
    return
  }

  const toDigits = resolveMetaWhatsAppToFromOrderRow(orderRow)
  if (!toDigits) {
    logger.info(`[whatsapp-order-confirmation] Order ${orderId} has no normalizable phone; skip WhatsApp.`)
    return
  }

  const body = buildWhatsAppOrderTemplateBody(orderRow, orderId)

  const attempts = Math.max(1, Math.min(5, parseInt(String(process.env.HORO_SUBSCRIBER_HTTP_RETRIES ?? "3"), 10) || 3))
  const result = await retryWithBackoff(
    `[whatsapp-order-confirmation] order=${orderId}`,
    attempts,
    () =>
      sendWhatsAppOrderConfirmationTemplate({
        graphVersion,
        phoneNumberId,
        accessToken,
        toDigits,
        templateName,
        templateLang,
        body,
      }),
    (r) => r.ok,
    logger,
  )

  if (!result?.ok) {
    logger.warn(
      `[whatsapp-order-confirmation] WhatsApp send failed for order ${orderId}: ${result?.error} (manual replay: order.placed)`,
    )
    return
  }

  logger.info(
    `[whatsapp-order-confirmation] WhatsApp template sent for order ${orderId} message_id=${result.messageId}`,
  )
}

export const config: SubscriberConfig = {
  event: "order.placed",
  context: {
    subscriberId: "whatsapp-order-confirmation",
  },
}
