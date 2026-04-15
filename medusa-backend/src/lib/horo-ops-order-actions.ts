import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import {
  capturePaymentWorkflow,
  createOrderFulfillmentWorkflow,
  markOrderFulfillmentAsDeliveredWorkflow,
} from "@medusajs/medusa/core-flows"

import { coerceMoneyAmount } from "./egp-amount"
import { ORDER_OPS_ACTION_GRAPH_FIELDS } from "./horo-ops-order-query-fields"

export type HoroOpsOrderActionKind = "capture_payment" | "create_fulfillment" | "mark_fulfillment_delivered"

const CAPTURE_ELIGIBLE = new Set(["authorized", "pending", "requires_capture"])

type GraphQuery = { graph: (a: Record<string, unknown>) => Promise<{ data?: unknown[] }> }

function flattenPayments(order: Record<string, unknown>): { id: string; status: string }[] {
  const out: { id: string; status: string }[] = []
  const cols = order.payment_collections
  if (!Array.isArray(cols)) return out
  for (const c of cols) {
    if (!c || typeof c !== "object") continue
    const payments = (c as Record<string, unknown>).payments
    if (!Array.isArray(payments)) continue
    for (const p of payments) {
      if (!p || typeof p !== "object") continue
      const rec = p as Record<string, unknown>
      const id = typeof rec.id === "string" ? rec.id : ""
      const status = typeof rec.status === "string" ? rec.status.toLowerCase() : ""
      if (id) out.push({ id, status })
    }
  }
  return out
}

export function findCapturablePaymentId(order: Record<string, unknown>): string | null {
  for (const p of flattenPayments(order)) {
    if (CAPTURE_ELIGIBLE.has(p.status)) return p.id
  }
  return null
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}

/**
 * `query.graph` order rows often nest the sellable line on `items[].item` and priced fields on
 * `items[].detail` (same shape as {@link normalizeGraphOrderForEmail}). Fulfillment workflows
 * expect each `id` to be the **order line item** id.
 */
function graphOrderLineItemId(el: Record<string, unknown>): string {
  const nested = isRecord(el.item) ? el.item : null
  const fromNested = nested && typeof nested.id === "string" ? nested.id.trim() : ""
  if (fromNested) return fromNested
  const direct = typeof el.id === "string" ? el.id.trim() : ""
  if (direct) return direct
  const lit = el.line_item_id
  if (typeof lit === "string" && lit.trim()) return lit.trim()
  return ""
}

function graphOrderLineQuantity(el: Record<string, unknown>): number {
  const detail = isRecord(el.detail) ? el.detail : null
  const nested = isRecord(el.item) ? el.item : null

  const coerced =
    coerceMoneyAmount(el.quantity) ??
    coerceMoneyAmount(detail?.quantity) ??
    coerceMoneyAmount(nested?.quantity)
  if (coerced !== null && coerced > 0) return Math.max(1, Math.floor(coerced))

  if (typeof el.quantity === "number" && Number.isFinite(el.quantity) && el.quantity > 0) {
    return Math.max(1, Math.floor(el.quantity))
  }
  if (typeof detail?.quantity === "number" && Number.isFinite(detail.quantity) && detail.quantity > 0) {
    return Math.max(1, Math.floor(detail.quantity))
  }
  if (typeof nested?.quantity === "number" && Number.isFinite(nested.quantity) && nested.quantity > 0) {
    return Math.max(1, Math.floor(nested.quantity))
  }
  if (typeof el.quantity === "string") {
    const n = parseInt(el.quantity, 10)
    if (Number.isFinite(n) && n > 0) return Math.max(1, n)
  }
  return 0
}

export function orderLineItemsForFulfillment(order: Record<string, unknown>): { id: string; quantity: number }[] {
  const items = order.items
  if (!Array.isArray(items)) return []
  const out: { id: string; quantity: number }[] = []
  for (const raw of items) {
    if (!raw || typeof raw !== "object") continue
    const el = raw as Record<string, unknown>
    const id = graphOrderLineItemId(el)
    const quantity = graphOrderLineQuantity(el)
    if (id && quantity > 0) out.push({ id, quantity })
  }
  return out
}

function listFulfillments(order: Record<string, unknown>): Record<string, unknown>[] {
  const f = order.fulfillments
  if (!Array.isArray(f)) return []
  return f.filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
}

function isUndelivered(f: Record<string, unknown>): boolean {
  const d = f.delivered_at
  if (d === null || d === undefined) return true
  if (typeof d === "string" && d.trim() === "") return true
  return false
}

export function findUndeliveredFulfillmentId(
  order: Record<string, unknown>,
  preferred?: string | null,
): string | null {
  const fuls = listFulfillments(order)
  if (preferred) {
    const match = fuls.find((x) => String(x.id ?? "") === preferred)
    if (match?.id && isUndelivered(match)) return String(match.id)
  }
  const open = fuls.find((x) => x.id && isUndelivered(x))
  if (open?.id) return String(open.id)
  return null
}

async function fetchOrderRow(query: GraphQuery, orderId: string): Promise<Record<string, unknown> | null> {
  const { data } = await query.graph({
    entity: "order",
    fields: [...ORDER_OPS_ACTION_GRAPH_FIELDS],
    filters: { id: orderId },
    pagination: { take: 1 },
  })
  const row = (data || [])[0] as Record<string, unknown> | undefined
  return row ?? null
}

export async function executeHoroOpsOrderAction(args: {
  scope: { resolve: (key: string) => unknown }
  orderId: string
  action: HoroOpsOrderActionKind
  fulfillmentId?: string | null
  actorUserId: string
}): Promise<{ order: Record<string, unknown> | null }> {
  const query = args.scope.resolve(ContainerRegistrationKeys.QUERY) as GraphQuery

  const row = await fetchOrderRow(query, args.orderId)
  if (!row) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Order not found")
  }

  switch (args.action) {
    case "capture_payment": {
      const paymentId = findCapturablePaymentId(row)
      if (!paymentId) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "No capturable payment found (expected payment status: authorized, pending, or requires_capture).",
        )
      }
      await capturePaymentWorkflow(args.scope as never).run({
        input: {
          payment_id: paymentId,
          captured_by: args.actorUserId,
        } as never,
      })
      break
    }
    case "create_fulfillment": {
      const items = orderLineItemsForFulfillment(row)
      if (items.length === 0) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, "No line items to fulfill")
      }
      await createOrderFulfillmentWorkflow(args.scope as never).run({
        input: {
          order_id: args.orderId,
          items,
          no_notification: true,
        } as never,
      })
      break
    }
    case "mark_fulfillment_delivered": {
      const fid = findUndeliveredFulfillmentId(row, args.fulfillmentId ?? null)
      if (!fid) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "No fulfillment to mark as delivered (create a fulfillment first, or all fulfillments are already delivered).",
        )
      }
      await markOrderFulfillmentAsDeliveredWorkflow(args.scope as never).run({
        input: {
          orderId: args.orderId,
          fulfillmentId: fid,
        } as never,
      })
      break
    }
    default:
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Unknown action")
  }

  const refreshed = await fetchOrderRow(query, args.orderId)
  return { order: refreshed }
}
