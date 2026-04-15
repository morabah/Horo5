/**
 * Medusa Remote Query `order` rows sometimes omit top-level `payment_status` / `fulfillment_status`
 * while nested `payment_collections` / `fulfillments` are present. Ops dashboard uses these helpers
 * so list tables and Instapay buckets stay consistent with nested state.
 */

const PAYMENT_CAPTURED_LIKE = new Set(["captured", "partially_captured", "completed"])

function pickString(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v.trim()
  return null
}

function paymentStatusesFromGraph(row: Record<string, unknown>): string[] {
  const fromPayments: string[] = []
  const cols = row.payment_collections
  if (!Array.isArray(cols)) return fromPayments
  for (const c of cols) {
    if (!c || typeof c !== "object") continue
    const payments = (c as Record<string, unknown>).payments
    if (!Array.isArray(payments)) continue
    for (const p of payments) {
      if (!p || typeof p !== "object") continue
      const st = pickString((p as Record<string, unknown>).status)
      if (st) fromPayments.push(st.toLowerCase())
    }
  }
  if (fromPayments.length > 0) return fromPayments

  const fromCollections: string[] = []
  for (const c of cols) {
    if (!c || typeof c !== "object") continue
    const colSt = pickString((c as Record<string, unknown>).status)
    if (colSt) fromCollections.push(colSt.toLowerCase())
  }
  return fromCollections
}

/** Prefer Medusa order `payment_status`; otherwise infer from nested payment collection / payments. */
export function effectivePaymentStatusFromOrderGraph(row: Record<string, unknown>): string | null {
  const top = pickString(row.payment_status) ?? pickString((row as { paymentStatus?: unknown }).paymentStatus)
  if (top) return top

  const statuses = paymentStatusesFromGraph(row)
  if (statuses.length === 0) return null

  const uniq = [...new Set(statuses)]
  if (uniq.every((s) => PAYMENT_CAPTURED_LIKE.has(s))) {
    return uniq.includes("partially_captured") ? "partially_captured" : "captured"
  }
  if (uniq.some((s) => PAYMENT_CAPTURED_LIKE.has(s)) && uniq.some((s) => !PAYMENT_CAPTURED_LIKE.has(s))) {
    return "partially_captured"
  }
  return uniq[0]
}

/** Prefer order `fulfillment_status`; otherwise infer from `fulfillments[].delivered_at` when present. */
export function effectiveFulfillmentStatusFromOrderGraph(row: Record<string, unknown>): string | null {
  const top = pickString(row.fulfillment_status) ?? pickString((row as { fulfillmentStatus?: unknown }).fulfillmentStatus)
  if (top) return top

  const fuls = row.fulfillments
  if (!Array.isArray(fuls) || fuls.length === 0) return null

  const objects = fuls.filter((f): f is Record<string, unknown> => !!f && typeof f === "object")
  if (objects.length === 0) return null

  let delivered = 0
  for (const f of objects) {
    const d = f.delivered_at
    if (d !== null && d !== undefined && !(typeof d === "string" && d.trim() === "")) delivered++
  }
  if (delivered === 0) return "not_fulfilled"
  if (delivered === objects.length) return "fulfilled"
  return "partially_fulfilled"
}
