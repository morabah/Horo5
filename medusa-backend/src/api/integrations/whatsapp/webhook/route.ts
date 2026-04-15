import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import {
  extractWhatsAppIncomingMessageEvents,
  extractWhatsAppStatusEvents,
  extractWhatsAppWebhookChangeMeta,
  stringifyWebhookBodyForLog,
} from "../../../../lib/whatsapp-cloud-order"

function hubQuery(req: MedusaRequest, key: string): string {
  const q = req.query as Record<string, unknown>
  const v = q[key]
  if (Array.isArray(v)) return String(v[0] ?? "")
  if (v == null) return ""
  return String(v)
}

type WebhookLogger = {
  info?: (m: string) => void
  warn?: (m: string) => void
}

function resolveLogger(req: MedusaRequest): WebhookLogger {
  try {
    return req.scope?.resolve(ContainerRegistrationKeys.LOGGER) as WebhookLogger
  } catch {
    return {}
  }
}

function logLine(logger: WebhookLogger, line: string) {
  if (typeof logger.info === "function") {
    logger.info(line)
  } else {
    console.info(line)
  }
}

function logWarn(logger: WebhookLogger, line: string) {
  if (typeof logger.warn === "function") {
    logger.warn(line)
  } else {
    console.warn(line)
  }
}

/**
 * Meta webhook verification (WhatsApp Cloud API).
 * @see https://developers.facebook.com/docs/graph-api/webhooks/getting-started
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const mode = hubQuery(req, "hub.mode")
  const token = hubQuery(req, "hub.verify_token")
  const challenge = hubQuery(req, "hub.challenge")
  const expected = process.env.WHATSAPP_VERIFY_TOKEN?.trim()

  if (mode === "subscribe" && expected && token === expected && challenge) {
    res.setHeader("Content-Type", "text/plain; charset=utf-8")
    return res.status(200).send(challenge)
  }

  return res.status(403).send("Forbidden")
}

/**
 * Meta WhatsApp webhook: incoming customer messages and outbound template status
 * (sent, delivered, read, failed). Always respond 200 quickly so Meta does not disable the webhook.
 * @see https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/components
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const logger = resolveLogger(req)

  let body: unknown = req.body
  if (typeof body === "string") {
    try {
      body = body.trim() ? JSON.parse(body) : {}
    } catch {
      logWarn(logger, "[whatsapp-webhook] POST body was non-JSON string; treating as empty object")
      body = {}
    }
  }

  const topObject =
    body && typeof body === "object" && typeof (body as { object?: unknown }).object === "string"
      ? (body as { object: string }).object
      : undefined
  if (topObject) {
    logLine(logger, `[whatsapp-webhook] POST object=${topObject}`)
  }

  const rawJson = stringifyWebhookBodyForLog(body)
  logLine(logger, `[whatsapp-webhook] POST raw_json=${rawJson}`)

  const changeMeta = extractWhatsAppWebhookChangeMeta(body)
  for (let i = 0; i < changeMeta.length; i++) {
    const c = changeMeta[i]!
    logLine(
      logger,
      `[whatsapp-webhook] change[${i}] field=${c.field || "?"} has_messages=${c.hasMessages} has_statuses=${c.hasStatuses}`,
    )
  }

  const incoming = extractWhatsAppIncomingMessageEvents(body)
  for (const m of incoming) {
    const preview =
      m.textBody != null && m.textBody.length > 200 ? `${m.textBody.slice(0, 200)}…` : (m.textBody ?? "")
    logLine(
      logger,
      `[whatsapp-webhook] incoming_message from=${m.from || "?"} id=${m.messageId || "?"} type=${m.type || "?"} ts=${m.timestamp || "?"} text=${JSON.stringify(preview)}`,
    )
  }

  const statuses = extractWhatsAppStatusEvents(body)
  for (const st of statuses) {
    const line = `[whatsapp-webhook] message_status id=${st.id || "?"} status=${st.status || "?"} errors=${st.errors != null ? JSON.stringify(st.errors) : ""}`
    if (st.status === "failed") {
      logWarn(logger, line)
    } else {
      logLine(logger, line)
    }
  }

  if (!incoming.length && !statuses.length && !changeMeta.length) {
    logLine(
      logger,
      "[whatsapp-webhook] POST no messages[] or statuses[] extracted (e.g. dashboard test event or other subscription fields); see raw_json above",
    )
  }

  return res.sendStatus(200)
}
