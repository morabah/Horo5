export type AdminOrderLookupIntent =
  | { kind: "id"; id: string }
  | { kind: "display_id"; value: number }
  | { kind: "invalid"; reason: string }

const INTERNAL_ORDER_ID = /^order_[A-Za-z0-9]+$/i

/** Support staff: resolve `HORO-18`, `#18`, `18`, or internal `order_…` for custom Admin lookup (not core `q` search). */
export function parseAdminOrderLookupQuery(raw: string): AdminOrderLookupIntent {
  const q = typeof raw === "string" ? raw.trim() : ""
  if (!q) return { kind: "invalid", reason: "empty" }

  if (INTERNAL_ORDER_ID.test(q)) {
    return { kind: "id", id: q }
  }

  const s = q.replace(/^#+/, "").trim()

  const horo = /^HORO-(\d+)$/i.exec(s)
  if (horo) {
    const value = parseInt(horo[1], 10)
    if (Number.isFinite(value) && value > 0) return { kind: "display_id", value }
    return { kind: "invalid", reason: "horo_display_id" }
  }

  if (/^\d{1,9}$/.test(s)) {
    const value = parseInt(s, 10)
    if (value > 0) return { kind: "display_id", value }
  }

  return { kind: "invalid", reason: "unrecognized" }
}
