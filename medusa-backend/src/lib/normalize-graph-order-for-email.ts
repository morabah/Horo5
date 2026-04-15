import { coerceMoneyAmount } from "./egp-amount"
import type { OrderConfirmationInput, OrderLineLike, ShippingMethodLike } from "./order-confirmation-email"

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}

/** First candidate that coerces to a finite number (including 0). */
function firstMoney(...candidates: unknown[]): unknown {
  for (const c of candidates) {
    const n = coerceMoneyAmount(c)
    if (n !== null && Number.isFinite(n)) return c
  }
  return undefined
}

/**
 * Prefer a non-zero money field when the graph leaves order-level totals at 0 but `summary` has real amounts.
 * `summary.totals` keys vary by Medusa version; include common aliases.
 */
function pickOrderMoney(
  row: Record<string, unknown>,
  totals: Record<string, unknown> | null,
  key: "subtotal" | "total" | "shipping_total" | "tax_total" | "discount_total",
  ...summaryAliases: string[]
): unknown {
  const direct = row[key]
  const summaryCandidates = [key, ...summaryAliases].map((k) => totals?.[k])
  const d = coerceMoneyAmount(direct)
  if (d !== null && d !== 0) return direct
  for (const c of summaryCandidates) {
    const s = coerceMoneyAmount(c)
    if (s !== null && s !== 0) return c
  }
  return firstMoney(direct, ...summaryCandidates) ?? direct ?? summaryCandidates[0]
}

function summaryTotalsFromRow(row: Record<string, unknown>): Record<string, unknown> | null {
  const s = row.summary
  if (Array.isArray(s) && s.length > 0 && isRecord(s[0])) {
    const t = s[0].totals
    if (isRecord(t)) return t
  }
  if (isRecord(s) && "totals" in s && isRecord(s.totals)) {
    return s.totals
  }
  return null
}

/**
 * `query.graph` on `order` returns repository-shaped rows: catalog fields on `items[].item`,
 * priced fields on `items[]` and/or `items[].detail`. Shipping rows may nest `shipping_method`.
 * `summary[0].totals` may hold order money when root totals are still zero at `order.placed`.
 */
export function normalizeGraphOrderForEmail(
  row: Record<string, unknown>,
  extras: Pick<OrderConfirmationInput, "storeUrl">,
): OrderConfirmationInput {
  const totals = summaryTotalsFromRow(row)

  const rawItems = row.items
  const items: OrderLineLike[] = []
  if (Array.isArray(rawItems)) {
    for (const el of rawItems) {
      if (!isRecord(el)) continue
      const nested = isRecord(el.item) ? el.item : null
      const detail = isRecord(el.detail) ? el.detail : null

      const product_title =
        (typeof nested?.product_title === "string" && nested.product_title) ||
        (typeof el.product_title === "string" && el.product_title) ||
        (typeof nested?.title === "string" && nested.title) ||
        (typeof el.title === "string" && el.title) ||
        null

      const variant_title =
        (typeof nested?.variant_title === "string" && nested.variant_title) ||
        (typeof el.variant_title === "string" && el.variant_title) ||
        null

      const product_handle =
        (typeof nested?.product_handle === "string" && nested.product_handle) ||
        (typeof el.product_handle === "string" && el.product_handle) ||
        null

      const quantity = firstMoney(el.quantity, detail?.quantity, nested?.quantity) ?? el.quantity ?? 1

      const unit_price = firstMoney(
        el.unit_price,
        detail?.unit_price,
        nested?.unit_price,
        detail?.raw_unit_price,
        nested?.raw_unit_price,
      )

      const lineTotalRaw = firstMoney(
        el.total,
        detail?.total,
        nested?.total,
        detail?.raw_total,
        nested?.raw_total,
      )

      const line: OrderLineLike = {
        title:
          typeof nested?.title === "string"
            ? nested.title
            : typeof el.title === "string"
              ? el.title
              : null,
        product_title,
        variant_title,
        quantity: quantity as OrderLineLike["quantity"],
        unit_price: unit_price as OrderLineLike["unit_price"],
        total: lineTotalRaw as OrderLineLike["total"],
        product_handle,
      }
      items.push(line)
    }
  }

  const rawShip = row.shipping_methods
  const shipping_methods: ShippingMethodLike[] = []
  if (Array.isArray(rawShip)) {
    for (const el of rawShip) {
      if (!isRecord(el)) continue
      const sm = isRecord(el.shipping_method) ? el.shipping_method : null
      const name =
        (typeof el.name === "string" && el.name) || (typeof sm?.name === "string" && sm.name) || "Shipping"
      const total = firstMoney(el.total, el.amount, sm?.total, sm?.amount, el.raw_amount, sm?.raw_amount)
      const shipRow: ShippingMethodLike = {
        name,
        total: total as number | string | null | undefined,
        amount: total as number | string | null | undefined,
      }
      shipping_methods.push(shipRow)
    }
  }

  const id = typeof row.id === "string" ? row.id : ""

  return {
    id,
    display_id: row.display_id as OrderConfirmationInput["display_id"],
    email: row.email as OrderConfirmationInput["email"],
    currency_code: row.currency_code as OrderConfirmationInput["currency_code"],
    created_at: row.created_at as OrderConfirmationInput["created_at"],
    subtotal: pickOrderMoney(row, totals, "subtotal", "item_subtotal") as OrderConfirmationInput["subtotal"],
    tax_total: pickOrderMoney(row, totals, "tax_total", "item_tax_total") as OrderConfirmationInput["tax_total"],
    shipping_total: pickOrderMoney(row, totals, "shipping_total", "shipping_subtotal") as OrderConfirmationInput["shipping_total"],
    discount_total: pickOrderMoney(row, totals, "discount_total") as OrderConfirmationInput["discount_total"],
    total: pickOrderMoney(row, totals, "total", "current_order_total", "transaction_total") as OrderConfirmationInput["total"],
    items,
    shipping_address: row.shipping_address as OrderConfirmationInput["shipping_address"],
    billing_address: row.billing_address as OrderConfirmationInput["billing_address"],
    shipping_methods:
      shipping_methods.length > 0 ? shipping_methods : (row.shipping_methods as OrderConfirmationInput["shipping_methods"]),
    storeUrl: extras.storeUrl ?? null,
  }
}
