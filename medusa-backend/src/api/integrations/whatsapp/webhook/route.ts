import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { extractWhatsAppStatusEvents } from "../../../../lib/whatsapp-cloud-order"

function hubQuery(req: MedusaRequest, key: string): string {
  const q = req.query as Record<string, unknown>
  const v = q[key]
  if (Array.isArray(v)) return String(v[0] ?? "")
  if (v == null) return ""
  return String(v)
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

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  let logger: { info?: (m: string) => void; warn?: (m: string) => void } | undefined
  try {
    logger = req.scope?.resolve(ContainerRegistrationKeys.LOGGER) as typeof logger
  } catch {
    /* no scope */
  }

  const body = req.body as unknown
  const line = `[whatsapp-webhook] POST body=${JSON.stringify(body).slice(0, 4000)}`
  if (typeof logger?.info === "function") {
    logger.info(line)
  } else {
    console.info(line)
  }

  const statuses = extractWhatsAppStatusEvents(body)
  for (const st of statuses) {
    const msg = `[whatsapp-webhook] status id=${st.id || "?"} status=${st.status || "?"} errors=${st.errors != null ? JSON.stringify(st.errors) : ""}`
    if (typeof logger?.warn === "function" && st.status === "failed") {
      logger.warn(msg)
    } else if (typeof logger?.info === "function") {
      logger.info(msg)
    } else {
      console.info(msg)
    }
  }

  return res.sendStatus(200)
}
