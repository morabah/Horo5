import { medusaAmountToEgp } from "./egp-amount"

/** Remote Query fields for the `whatsapp-order-confirmation` subscriber. */
export const ORDER_WHATSAPP_GRAPH_FIELDS = [
  "id",
  "display_id",
  "currency_code",
  "total",
  "shipping_address.first_name",
  "shipping_address.phone",
  "billing_address.phone",
  "payment_collections.payment_sessions.provider_id",
  "payment_collections.payment_sessions.status",
] as const

/**
 * Normalize checkout / address phone to E.164 for Egypt (+20…).
 * Accepts values like +201005038293, 01005038293, 201005038293, whatsapp:+20…
 */
export function normalizeBuyerPhoneE164(raw: string | null | undefined): string | null {
  if (raw == null) return null
  let s = String(raw).trim().replace(/[\s\-().]/g, "")
  if (!s) return null
  const lower = s.toLowerCase()
  if (lower.startsWith("whatsapp:")) {
    s = s.slice("whatsapp:".length)
  }
  if (s.startsWith("00")) {
    s = `+${s.slice(2)}`
  }
  if (!s.startsWith("+")) {
    if (s.startsWith("0") && s.length >= 10 && s.length <= 12) {
      s = `+20${s.slice(1)}`
    } else if (s.startsWith("20") && s.length >= 11) {
      s = `+${s}`
    } else if (/^1\d{9}$/.test(s)) {
      s = `+20${s}`
    }
  }
  if (!/^\+20\d{9,11}$/.test(s)) {
    return null
  }
  return s
}

/** Meta Cloud API `to` field: digits only, no leading +. */
export function toMetaWhatsAppRecipientDigits(e164: string): string | null {
  const digits = e164.replace(/^\+/, "").replace(/\D/g, "")
  if (digits.length < 10 || digits.length > 15) {
    return null
  }
  return digits
}

export function resolveMetaWhatsAppToFromOrderRow(orderRow: Record<string, unknown>): string | null {
  const ship = orderRow.shipping_address as Record<string, unknown> | null | undefined
  const bill = orderRow.billing_address as Record<string, unknown> | null | undefined
  const raw =
    (ship?.phone && typeof ship.phone === "string" ? ship.phone : null) ||
    (bill?.phone && typeof bill.phone === "string" ? bill.phone : null)
  const e164 = normalizeBuyerPhoneE164(raw)
  if (!e164) return null
  return toMetaWhatsAppRecipientDigits(e164)
}

export function orderRefLabelForWhatsapp(orderId: string, displayId: unknown): string {
  if (typeof displayId === "number" && Number.isFinite(displayId) && displayId > 0) {
    return `HORO-${Math.floor(displayId)}`
  }
  if (typeof displayId === "string") {
    const n = parseInt(displayId.trim(), 10)
    if (Number.isFinite(n) && n > 0) {
      return `HORO-${n}`
    }
  }
  return orderId
}

export function formatMoneyLineForWhatsapp(total: unknown, currencyCode: string | null | undefined): string {
  const amt = medusaAmountToEgp(total)
  const cur = (currencyCode || "egp").toUpperCase()
  return `${amt.toLocaleString("en-US")} ${cur}`
}

const SESSION_OK = new Set(["authorized", "captured", "pending"])

function paymentLabelFromProviderId(providerId: string): string {
  const n = providerId.toLowerCase()
  if (n.includes("system_default")) return "Cash on delivery"
  if (n.includes("apple")) return "Apple Pay"
  if (n.includes("google")) return "Google Pay"
  if (n.includes("paymob")) return "Card"
  return "Card"
}

export function buildPaymentLabelFromOrderRow(orderRow: Record<string, unknown>): string {
  const cols = orderRow.payment_collections
  if (!Array.isArray(cols)) {
    return "Unknown"
  }

  type Session = { provider_id?: string | null; status?: string | null }
  const sessions: Session[] = []
  for (const col of cols) {
    if (!col || typeof col !== "object") continue
    const raw = (col as { payment_sessions?: unknown }).payment_sessions
    if (!Array.isArray(raw)) continue
    for (const s of raw) {
      if (s && typeof s === "object" && typeof (s as Session).provider_id === "string") {
        sessions.push(s as Session)
      }
    }
  }

  if (!sessions.length) {
    return "Unknown"
  }

  const scored = sessions.map((s) => {
    const st = String(s.status || "").toLowerCase()
    const ok = SESSION_OK.has(st) ? 1 : 0
    return { s, ok }
  })
  scored.sort((a, b) => b.ok - a.ok)

  const pick = scored[0]?.s
  const pid = pick?.provider_id
  if (!pid) return "Unknown"
  return paymentLabelFromProviderId(pid)
}

export type WhatsAppOrderTemplateBody = {
  firstName: string
  orderRef: string
  moneyLine: string
  paymentLabel: string
}

export function buildWhatsAppOrderTemplateBody(orderRow: Record<string, unknown>, orderId: string): WhatsAppOrderTemplateBody {
  const ship = orderRow.shipping_address as Record<string, unknown> | null | undefined
  const first =
    ship && typeof ship.first_name === "string" && ship.first_name.trim()
      ? ship.first_name.trim()
      : "Customer"
  const currency = typeof orderRow.currency_code === "string" ? orderRow.currency_code : "egp"
  return {
    firstName: first,
    orderRef: orderRefLabelForWhatsapp(orderId, orderRow.display_id),
    moneyLine: formatMoneyLineForWhatsapp(orderRow.total, currency),
    paymentLabel: buildPaymentLabelFromOrderRow(orderRow),
  }
}

export function buildWhatsAppTemplateMessagePayload(args: {
  toDigits: string
  templateName: string
  templateLang: string
  body: WhatsAppOrderTemplateBody
}): Record<string, unknown> {
  const { firstName, orderRef, moneyLine, paymentLabel } = args.body
  return {
    messaging_product: "whatsapp",
    to: args.toDigits,
    type: "template",
    template: {
      name: args.templateName,
      language: { code: args.templateLang },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: firstName },
            { type: "text", text: orderRef },
            { type: "text", text: moneyLine },
            { type: "text", text: paymentLabel },
          ],
        },
      ],
    },
  }
}

export async function sendWhatsAppOrderConfirmationTemplate(args: {
  graphVersion: string
  phoneNumberId: string
  accessToken: string
  toDigits: string
  templateName: string
  templateLang: string
  body: WhatsAppOrderTemplateBody
}): Promise<{ ok: true; messageId: string; raw: unknown } | { ok: false; error: string; raw?: unknown }> {
  const version = args.graphVersion.trim().replace(/^\/+/, "")
  const url = `https://graph.facebook.com/${version}/${encodeURIComponent(args.phoneNumberId)}/messages`
  const payload = buildWhatsAppTemplateMessagePayload({
    toDigits: args.toDigits,
    templateName: args.templateName,
    templateLang: args.templateLang,
    body: args.body,
  })

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  const text = await res.text()
  let parsed: unknown
  try {
    parsed = text ? JSON.parse(text) : null
  } catch {
    return { ok: false, error: text || `HTTP ${res.status}` }
  }

  if (!res.ok) {
    return {
      ok: false,
      error: typeof parsed === "object" && parsed !== null && "error" in parsed
        ? JSON.stringify((parsed as { error: unknown }).error)
        : JSON.stringify(parsed),
      raw: parsed,
    }
  }

  const msgArr = (parsed as { messages?: Array<{ id?: string }> }).messages
  const messageId = msgArr?.[0]?.id
  if (!messageId) {
    return { ok: false, error: "Missing messages[0].id in Graph response", raw: parsed }
  }

  return { ok: true, messageId, raw: parsed }
}

export type WhatsAppStatusEvent = {
  id?: string
  status?: string
  errors?: unknown
}

export type WhatsAppIncomingMessageEvent = {
  from?: string
  messageId?: string
  type?: string
  textBody?: string
  timestamp?: string
}

export type WhatsAppWebhookChangeMeta = {
  field?: string
  hasStatuses: boolean
  hasMessages: boolean
}

/** Max chars for one log line of `JSON.stringify(webhookBody)` (avoid runaway log volume). */
export const WHATSAPP_WEBHOOK_RAW_JSON_LOG_MAX = 100_000

export function stringifyWebhookBodyForLog(body: unknown): string {
  try {
    const s = JSON.stringify(body)
    if (s.length <= WHATSAPP_WEBHOOK_RAW_JSON_LOG_MAX) {
      return s
    }
    return `${s.slice(0, WHATSAPP_WEBHOOK_RAW_JSON_LOG_MAX)}...(truncated, total_chars=${s.length})`
  } catch {
    return "[whatsapp-webhook] body could not be serialized to JSON"
  }
}

function walkWebhookChanges(
  body: unknown,
  visit: (value: Record<string, unknown>, change: Record<string, unknown>) => void,
): void {
  if (!body || typeof body !== "object") return
  const entry = (body as { entry?: unknown[] }).entry
  if (!Array.isArray(entry)) return

  for (const ent of entry) {
    if (!ent || typeof ent !== "object") continue
    const changes = (ent as { changes?: unknown[] }).changes
    if (!Array.isArray(changes)) continue
    for (const ch of changes) {
      if (!ch || typeof ch !== "object") continue
      const change = ch as Record<string, unknown>
      const value = change.value
      if (!value || typeof value !== "object") continue
      visit(value as Record<string, unknown>, change)
    }
  }
}

/** Per-change `field` (e.g. `messages`) and whether `value` contains buyer messages or outbound status updates. */
export function extractWhatsAppWebhookChangeMeta(body: unknown): WhatsAppWebhookChangeMeta[] {
  const out: WhatsAppWebhookChangeMeta[] = []
  walkWebhookChanges(body, (value, change) => {
    const field = change.field
    const statuses = value.statuses
    const messages = value.messages
    out.push({
      field: typeof field === "string" ? field : undefined,
      hasStatuses: Array.isArray(statuses) && statuses.length > 0,
      hasMessages: Array.isArray(messages) && messages.length > 0,
    })
  })
  return out
}

/** Best-effort extraction of outbound message status events from a Meta webhook POST body. */
export function extractWhatsAppStatusEvents(body: unknown): WhatsAppStatusEvent[] {
  const out: WhatsAppStatusEvent[] = []
  walkWebhookChanges(body, (value) => {
    const statuses = value.statuses
    if (!Array.isArray(statuses)) return
    for (const st of statuses) {
      if (!st || typeof st !== "object") continue
      const o = st as { id?: unknown; status?: unknown; errors?: unknown }
      out.push({
        id: typeof o.id === "string" ? o.id : undefined,
        status: typeof o.status === "string" ? o.status : undefined,
        errors: o.errors,
      })
    }
  })
  return out
}

/** Incoming user → business messages under `value.messages` (text and basic metadata). */
export function extractWhatsAppIncomingMessageEvents(body: unknown): WhatsAppIncomingMessageEvent[] {
  const out: WhatsAppIncomingMessageEvent[] = []
  walkWebhookChanges(body, (value) => {
    const messages = value.messages
    if (!Array.isArray(messages)) return
    for (const m of messages) {
      if (!m || typeof m !== "object") continue
      const o = m as {
        from?: unknown
        id?: unknown
        type?: unknown
        timestamp?: unknown
        text?: { body?: unknown }
      }
      const textBody =
        o.text && typeof o.text === "object" && typeof o.text.body === "string" ? o.text.body : undefined
      const ts =
        typeof o.timestamp === "string"
          ? o.timestamp
          : typeof o.timestamp === "number"
            ? String(o.timestamp)
            : undefined
      out.push({
        from: typeof o.from === "string" ? o.from : undefined,
        messageId: typeof o.id === "string" ? o.id : undefined,
        type: typeof o.type === "string" ? o.type : undefined,
        textBody,
        timestamp: ts,
      })
    }
  })
  return out
}
