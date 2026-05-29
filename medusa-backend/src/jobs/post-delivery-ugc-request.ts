import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateOrderWorkflow } from "@medusajs/medusa/core-flows"

import {
  isUgcRequestDue,
  readMetadata,
} from "../lib/post-delivery-ugc"
import { sendOrderConfirmationResend } from "../lib/order-confirmation-email"
import {
  buildPostDeliveryUgcRequestCopy,
  resolveMetaWhatsAppToFromOrderRow,
  sendWhatsAppTextMessage,
} from "../lib/whatsapp-cloud-order"

const ORDER_UGC_FIELDS = [
  "id",
  "display_id",
  "email",
  "metadata",
  "fulfillment_status",
  "fulfillments.*",
  "shipping_address.first_name",
  "shipping_address.phone",
  "billing_address.phone",
] as const

function maxOrders() {
  const n = parseInt(String(process.env.HORO_UGC_REQUEST_JOB_TAKE ?? ""), 10)
  if (!Number.isFinite(n) || n < 1) return 250
  return Math.min(1000, n)
}

function metadataLocale(metadata: Record<string, unknown>): "ar" | "en" {
  const raw = metadata.locale ?? metadata.ui_locale ?? metadata.language
  return raw === "ar" ? "ar" : "en"
}

function attempts(metadata: Record<string, unknown>): number {
  const n = metadata.ugc_request_attempts
  return typeof n === "number" && Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function validEmail(value: unknown): string | null {
  if (typeof value !== "string") return null
  const email = value.trim()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null
}

function orderRef(row: Record<string, unknown>): string {
  return typeof row.display_id === "number" && Number.isFinite(row.display_id) && row.display_id > 0
    ? `HORO-${Math.floor(row.display_id)}`
    : typeof row.id === "string"
      ? row.id
      : "your HORO order"
}

function firstName(row: Record<string, unknown>): string {
  const address = isRecord(row.shipping_address) ? row.shipping_address : {}
  return typeof address.first_name === "string" && address.first_name.trim()
    ? address.first_name.trim()
    : "there"
}

function buildPostDeliveryUgcEmail(args: {
  locale: "ar" | "en"
  name: string
  orderRef: string
}) {
  if (args.locale === "ar") {
    return {
      subject: `شاركنا إطلالتك من HORO - ${args.orderRef}`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#161616;max-width:560px;margin:0 auto;padding:24px" dir="rtl">
          <h1 style="font-size:22px;margin:0 0 12px">وصلت قطعتك؟</h1>
          <p>أهلاً ${escapeHtml(args.name)}، نتمنى تكون قطعة HORO عجبتك.</p>
          <p>لو حابب، ابعتلنا صورة للإطلالة أو رأيك في المقاس والخامة. لن نستخدم أي صورة بدون إذن واضح منك.</p>
          <p style="font-size:13px;color:#666">رقم الطلب: ${escapeHtml(args.orderRef)}</p>
        </div>
      `,
    }
  }

  return {
    subject: `Share your HORO fit - ${args.orderRef}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#161616;max-width:560px;margin:0 auto;padding:24px">
        <h1 style="font-size:22px;margin:0 0 12px">Did your HORO piece arrive?</h1>
        <p>Hi ${escapeHtml(args.name)}, we hope the tee feels right.</p>
        <p>If you want, send us a fit photo or a quick note about sizing, fabric, or print quality. We will not feature a photo without explicit permission.</p>
        <p style="font-size:13px;color:#666">Order: ${escapeHtml(args.orderRef)}</p>
      </div>
    `,
  }
}

async function updateUgcMetadata(container: MedusaContainer, orderId: string, metadata: Record<string, unknown>) {
  await updateOrderWorkflow(container).run({
    input: {
      id: orderId,
      user_id: "horo_post_delivery_ugc",
      metadata,
    } as never,
  })
}

export default async function postDeliveryUgcRequestJob(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim()
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim()
  const graphVersion = (process.env.META_GRAPH_VERSION || "v23.0").trim()
  const resendApiKey = process.env.RESEND_API_KEY?.trim()
  const emailFrom = process.env.ORDER_CONFIRMATION_FROM?.trim()
  const canSendWhatsapp = Boolean(accessToken && phoneNumberId)
  const canSendEmail = Boolean(resendApiKey && emailFrom)

  if (!canSendWhatsapp && !canSendEmail) {
    logger.info("[post-delivery-ugc-request] WhatsApp and email credentials unset; leaving due UGC requests pending/manual.")
    return
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY) as {
    graph: (args: Record<string, unknown>) => Promise<{ data?: unknown[] }>
  }
  const { data } = await query.graph({
    entity: "order",
    fields: [...ORDER_UGC_FIELDS],
    pagination: { take: maxOrders(), order: { updated_at: "DESC" } },
  })

  const rows = ((data || []) as Array<Record<string, unknown>>).filter((row) => isUgcRequestDue(row))
  if (rows.length === 0) {
    logger.info("[post-delivery-ugc-request] No due UGC requests.")
    return
  }

  for (const row of rows) {
    const orderId = typeof row.id === "string" ? row.id : ""
    if (!orderId) continue
    const currentMetadata = readMetadata(row.metadata)
    const nextAttempt = attempts(currentMetadata) + 1
    const locale = metadataLocale(currentMetadata)
    const now = new Date().toISOString()
    const nextMetadata: Record<string, unknown> = {
      ...currentMetadata,
      ugc_request_attempts: nextAttempt,
    }

    let sent = currentMetadata.ugc_request_whatsapp_status === "sent" || currentMetadata.ugc_request_email_status === "sent"
    let failed = false
    const errors: string[] = []

    if (canSendWhatsapp && currentMetadata.ugc_request_whatsapp_status !== "sent") {
      const toDigits = resolveMetaWhatsAppToFromOrderRow(row)
      if (!toDigits) {
        failed = true
        errors.push("missing_normalizable_phone")
        nextMetadata.ugc_request_whatsapp_status = "failed"
        nextMetadata.ugc_request_whatsapp_failed_at = now
      } else {
        const result = await sendWhatsAppTextMessage({
          graphVersion,
          phoneNumberId: phoneNumberId!,
          accessToken: accessToken!,
          toDigits,
          text: buildPostDeliveryUgcRequestCopy(locale),
        })

        if (result.ok) {
          sent = true
          nextMetadata.ugc_request_whatsapp_status = "sent"
          nextMetadata.ugc_request_whatsapp_sent_at = now
          nextMetadata.ugc_request_message_id = result.messageId
        } else {
          failed = true
          errors.push(result.error)
          nextMetadata.ugc_request_whatsapp_status = "failed"
          nextMetadata.ugc_request_whatsapp_failed_at = now
        }
      }
    }

    if (canSendEmail && currentMetadata.ugc_request_email_status !== "sent") {
      const to = validEmail(row.email)
      if (!to) {
        failed = true
        errors.push("missing_valid_email")
        nextMetadata.ugc_request_email_status = "failed"
        nextMetadata.ugc_request_email_failed_at = now
      } else {
        const email = buildPostDeliveryUgcEmail({
          locale,
          name: firstName(row),
          orderRef: orderRef(row),
        })
        const result = await sendOrderConfirmationResend({
          apiKey: resendApiKey!,
          from: emailFrom!,
          to,
          subject: email.subject,
          html: email.html,
        })

        if (result.ok) {
          sent = true
          nextMetadata.ugc_request_email_status = "sent"
          nextMetadata.ugc_request_email_sent_at = now
        } else {
          failed = true
          errors.push(result.error || "email_send_failed")
          nextMetadata.ugc_request_email_status = "failed"
          nextMetadata.ugc_request_email_failed_at = now
        }
      }
    }

    if (sent) {
      await updateUgcMetadata(container, orderId, {
        ...nextMetadata,
        ugc_request_status: "sent",
        ugc_request_sent_at: now,
        ugc_request_channel: [
          nextMetadata.ugc_request_whatsapp_status === "sent" ? "whatsapp" : null,
          nextMetadata.ugc_request_email_status === "sent" ? "email" : null,
        ].filter(Boolean).join("+") || currentMetadata.ugc_request_channel || "unknown",
      })
      logger.info(`[post-delivery-ugc-request] Sent UGC request for order ${orderId}.`)
      continue
    }

    await updateUgcMetadata(container, orderId, {
      ...nextMetadata,
      ugc_request_status: "failed",
      ugc_request_failed_at: now,
      ugc_request_error: errors.filter(Boolean).join("; ") || (failed ? "ugc_request_failed" : "no_channel_attempted"),
    })
    logger.warn(`[post-delivery-ugc-request] Failed UGC request for order ${orderId}: ${errors.join("; ") || "no channel attempted"}`)
  }
}

export const config = {
  name: "post-delivery-ugc-request",
  schedule: "0 10 * * *",
}
