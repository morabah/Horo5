const DEFAULT_UGC_DELAY_DAYS = 3

function envDelayDays() {
  const n = parseInt(String(process.env.HORO_UGC_REQUEST_DELAY_DAYS ?? ""), 10)
  if (!Number.isFinite(n) || n < 0) return DEFAULT_UGC_DELAY_DAYS
  return Math.min(30, n)
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}

export function readMetadata(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

export function deliveredAtFromOrder(order: Record<string, unknown>, fallback = new Date()): Date {
  const fulfillments = Array.isArray(order.fulfillments) ? order.fulfillments : []
  const delivered = fulfillments
    .map((raw) => {
      if (!raw || typeof raw !== "object") return null
      const value = (raw as Record<string, unknown>).delivered_at
      if (typeof value === "string" || typeof value === "number" || value instanceof Date) {
        const date = new Date(value)
        return Number.isNaN(date.getTime()) ? null : date
      }
      return null
    })
    .filter((date): date is Date => date != null)
    .sort((a, b) => b.getTime() - a.getTime())

  return delivered[0] ?? fallback
}

export function buildPendingUgcRequestMetadata(args: {
  existingMetadata: Record<string, unknown>
  deliveredAt?: Date
  now?: Date
}) {
  const now = args.now ?? new Date()
  const deliveredAt = args.deliveredAt ?? now
  const existingStatus = args.existingMetadata.ugc_request_status
  if (existingStatus === "sent" || existingStatus === "skipped") {
    return args.existingMetadata
  }

  return {
    ...args.existingMetadata,
    ugc_request_status: existingStatus === "failed" ? "failed" : "pending",
    ugc_request_channel: args.existingMetadata.ugc_request_channel ?? "whatsapp",
    ugc_request_delivered_at: args.existingMetadata.ugc_request_delivered_at ?? deliveredAt.toISOString(),
    ugc_request_due_at:
      args.existingMetadata.ugc_request_due_at ??
      addDays(deliveredAt, envDelayDays()).toISOString(),
    ugc_request_attempts:
      typeof args.existingMetadata.ugc_request_attempts === "number"
        ? args.existingMetadata.ugc_request_attempts
        : 0,
    ugc_request_created_at: args.existingMetadata.ugc_request_created_at ?? now.toISOString(),
  }
}

export function isOrderDeliveredForUgc(order: Record<string, unknown>): boolean {
  const status = typeof order.fulfillment_status === "string" ? order.fulfillment_status.toLowerCase() : ""
  if (["fulfilled", "shipped", "delivered", "partially_delivered"].includes(status)) return true
  const fulfillments = Array.isArray(order.fulfillments) ? order.fulfillments : []
  return fulfillments.some((raw) => {
    if (!raw || typeof raw !== "object") return false
    const value = (raw as Record<string, unknown>).delivered_at
    return value !== null && value !== undefined && !(typeof value === "string" && value.trim() === "")
  })
}

export function isUgcRequestDue(order: Record<string, unknown>, now = new Date()): boolean {
  if (!isOrderDeliveredForUgc(order)) return false
  const metadata = readMetadata(order.metadata)
  if (metadata.ugc_request_status !== "pending") return false
  const dueRaw = metadata.ugc_request_due_at
  if (typeof dueRaw !== "string" && !(dueRaw instanceof Date)) return false
  const due = new Date(dueRaw)
  if (Number.isNaN(due.getTime())) return false
  return due.getTime() <= now.getTime()
}

