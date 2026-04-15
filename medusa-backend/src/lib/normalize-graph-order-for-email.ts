import { coerceMoneyAmount } from "./egp-amount"
import { resolveEstimatedDeliveryWindowForEmail } from "./order-confirmation-delivery"
import type { OrderConfirmationInput, OrderLineLike, ShippingMethodLike } from "./order-confirmation-email"

function sumLineMoneyForReconcile(lines: OrderLineLike[]): number {
  let s = 0
  for (const it of lines) {
    const t = coerceMoneyAmount(it.total)
    if (t !== null && t > 0) {
      s += t
      continue
    }
    const u = coerceMoneyAmount(it.unit_price)
    const qRaw = it.quantity
    const q =
      typeof qRaw === "number" && Number.isFinite(qRaw)
        ? Math.max(1, Math.floor(qRaw))
        : Math.max(1, Math.floor(coerceMoneyAmount(qRaw) ?? 1))
    if (u !== null && u > 0) s += u * q
  }
  return s
}

function sumShippingMoneyForReconcile(methods: ShippingMethodLike[]): number {
  let s = 0
  for (const m of methods) {
    if (!m) continue
    const t = coerceMoneyAmount(m.total)
    if (t !== null && t > 0) {
      s += t
      continue
    }
    const a = coerceMoneyAmount(m.amount)
    if (a !== null && a > 0) s += a
  }
  return s
}

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

      const qtyNum = (() => {
        const q =
          coerceMoneyAmount(el.quantity) ??
          coerceMoneyAmount(detail?.quantity) ??
          coerceMoneyAmount(nested?.quantity)
        if (q !== null && q > 0) return Math.max(1, Math.floor(q))
        if (typeof el.quantity === "number" && Number.isFinite(el.quantity)) return Math.max(1, Math.floor(el.quantity))
        if (typeof detail?.quantity === "number" && Number.isFinite(detail.quantity)) return Math.max(1, Math.floor(detail.quantity))
        return 1
      })()
      const quantity: OrderLineLike["quantity"] = qtyNum

      const lineSubtotal = firstMoney(
        el.subtotal,
        el.raw_subtotal,
        detail?.subtotal,
        detail?.raw_subtotal,
        nested?.subtotal,
      )

      let unit_price = firstMoney(
        el.unit_price,
        detail?.unit_price,
        nested?.unit_price,
        detail?.raw_unit_price,
        nested?.raw_unit_price,
        el.discounted_unit_price,
        detail?.discounted_unit_price,
        nested?.discounted_unit_price,
      )

      let lineTotalRaw = firstMoney(
        el.total,
        detail?.total,
        nested?.total,
        detail?.raw_total,
        nested?.raw_total,
        lineSubtotal,
      )

      const subN = coerceMoneyAmount(lineSubtotal)
      if ((coerceMoneyAmount(unit_price) ?? 0) === 0 && subN !== null && subN > 0 && qtyNum > 0) {
        unit_price = subN / qtyNum
      }
      if ((coerceMoneyAmount(lineTotalRaw) ?? 0) === 0 && subN !== null && subN > 0) {
        lineTotalRaw = subN
      }
      if ((coerceMoneyAmount(lineTotalRaw) ?? 0) === 0 && (coerceMoneyAmount(unit_price) ?? 0) > 0) {
        lineTotalRaw = (coerceMoneyAmount(unit_price) ?? 0) * qtyNum
      }

      const line: OrderLineLike = {
        title:
          typeof nested?.title === "string"
            ? nested.title
            : typeof el.title === "string"
              ? el.title
              : null,
        product_title,
        variant_title,
        quantity,
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

  let subtotal = pickOrderMoney(row, totals, "subtotal", "item_subtotal", "items_total", "product_subtotal") as OrderConfirmationInput["subtotal"]
  let tax_total = pickOrderMoney(row, totals, "tax_total", "item_tax_total") as OrderConfirmationInput["tax_total"]
  let shipping_total = pickOrderMoney(row, totals, "shipping_total", "shipping_subtotal") as OrderConfirmationInput["shipping_total"]
  let discount_total = pickOrderMoney(row, totals, "discount_total") as OrderConfirmationInput["discount_total"]
  let total = pickOrderMoney(row, totals, "total", "current_order_total", "transaction_total") as OrderConfirmationInput["total"]

  const lineSum = sumLineMoneyForReconcile(items)
  const shipSum = sumShippingMoneyForReconcile(shipping_methods)
  if ((coerceMoneyAmount(subtotal) ?? 0) === 0 && lineSum > 0) {
    subtotal = lineSum
  }
  if ((coerceMoneyAmount(shipping_total) ?? 0) === 0 && shipSum > 0) {
    shipping_total = shipSum
  }
  const sN = coerceMoneyAmount(subtotal) ?? 0
  const shN = coerceMoneyAmount(shipping_total) ?? 0
  const txN = coerceMoneyAmount(tax_total) ?? 0
  const discN = coerceMoneyAmount(discount_total) ?? 0
  if ((coerceMoneyAmount(total) ?? 0) === 0 && sN + shN + txN - discN > 0) {
    total = sN + shN + txN - discN
  }

  const createdAt = row.created_at as OrderConfirmationInput["created_at"]
  const estimated_delivery_window = resolveEstimatedDeliveryWindowForEmail(createdAt, row.metadata)

  return {
    id,
    display_id: row.display_id as OrderConfirmationInput["display_id"],
    email: row.email as OrderConfirmationInput["email"],
    currency_code: row.currency_code as OrderConfirmationInput["currency_code"],
    created_at: createdAt,
    estimated_delivery_window,
    subtotal,
    tax_total,
    shipping_total,
    discount_total,
    total,
    items,
    shipping_address: row.shipping_address as OrderConfirmationInput["shipping_address"],
    billing_address: row.billing_address as OrderConfirmationInput["billing_address"],
    shipping_methods:
      shipping_methods.length > 0 ? shipping_methods : (row.shipping_methods as OrderConfirmationInput["shipping_methods"]),
    storeUrl: extras.storeUrl ?? null,
  }
}
