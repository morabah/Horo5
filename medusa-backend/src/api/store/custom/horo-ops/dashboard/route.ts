import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import {
  classifyOpsOrders,
  computeSlaDeadlineUtc,
  friendlyDisplayId,
  isDeliveredFulfillment,
  isPaymentCaptured,
  readOpsClassifyConfigFromEnv,
  utcYmd,
  type OpsOrderRow,
} from "../../../../../lib/horo-ops-classify"
import { assertOpsBackendAccess } from "../../../../../lib/horo-ops-backend-auth"
import { orderUsesInstapayPayment } from "../../../../../lib/horo-ops-order-actions"
import {
  effectiveFulfillmentStatusFromOrderGraph,
  effectivePaymentStatusFromOrderGraph,
} from "../../../../../lib/horo-ops-order-graph-coerce"
import {
  ORDER_OPS_CORE_FIELDS,
  ORDER_OPS_GRAPH_FIELDS,
  ORDER_OPS_PAYMENT_DETECT_FIELDS,
} from "../../../../../lib/horo-ops-order-query-fields"

/** Dashboard-only: infer fulfillment when top-level field is missing from the graph. */
const DASHBOARD_ORDER_EXTRA_FIELDS = ["fulfillments.*"] as const

function parseIntParam(raw: unknown, fallback: number, max: number): number {
  const s = typeof raw === "string" ? raw : Array.isArray(raw) ? String(raw[0] ?? "") : ""
  const n = parseInt(s.trim(), 10)
  if (!Number.isFinite(n) || n < 0) return fallback
  return Math.min(n, max)
}

function parseBoolQuery(raw: unknown, defaultVal: boolean): boolean {
  const s =
    typeof raw === "string"
      ? raw.trim().toLowerCase()
      : Array.isArray(raw)
        ? String(raw[0] ?? "").trim().toLowerCase()
        : ""
  if (s === "1" || s === "true" || s === "yes") return true
  if (s === "0" || s === "false" || s === "no") return false
  return defaultVal
}

function parseFetchMode(raw: unknown): "all" | "page" {
  const s =
    typeof raw === "string"
      ? raw.trim().toLowerCase()
      : Array.isArray(raw)
        ? String(raw[0] ?? "").trim().toLowerCase()
        : ""
  if (s === "page" || s === "paged") return "page"
  return "all"
}

function listMaxFromEnv(): number {
  const n = parseInt(String(process.env.HORO_OPS_LIST_MAX ?? "").trim(), 10)
  return Number.isFinite(n) && n > 0 ? Math.min(n, 500) : 200
}

function dashboardMaxOrdersFromEnv(): number {
  const n = parseInt(String(process.env.HORO_OPS_DASHBOARD_MAX_ORDERS ?? "").trim(), 10)
  const cap = 50_000
  if (!Number.isFinite(n) || n < 1) return 10_000
  return Math.min(n, cap)
}

function dashboardBatchFromEnv(): number {
  const n = parseInt(String(process.env.HORO_OPS_DASHBOARD_BATCH ?? "").trim(), 10)
  if (!Number.isFinite(n) || n < 20) return 100
  return Math.min(250, Math.max(20, n))
}

/**
 * Medusa `query.graph` often returns `Date` instances for datetime columns; our SLA logic needs ISO strings.
 */
function coerceIsoDateTime(v: unknown): string {
  if (typeof v === "string" && v.trim().length > 0) return v.trim()
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v.toISOString()
  if (typeof v === "number" && Number.isFinite(v)) {
    const d = new Date(v)
    return Number.isNaN(d.getTime()) ? "" : d.toISOString()
  }
  return ""
}

function coerceOptionalIso(v: unknown): string | null {
  const s = coerceIsoDateTime(v)
  return s.length > 0 ? s : null
}

function toOpsRow(row: Record<string, unknown>): OpsOrderRow {
  return {
    id: String(row.id ?? ""),
    display_id: row.display_id as OpsOrderRow["display_id"],
    email: typeof row.email === "string" ? row.email : null,
    created_at: coerceIsoDateTime(row.created_at),
    updated_at: coerceOptionalIso(row.updated_at),
    status: typeof row.status === "string" ? row.status : null,
    currency_code: typeof row.currency_code === "string" ? row.currency_code : null,
    total: row.total,
    fulfillment_status: effectiveFulfillmentStatusFromOrderGraph(row),
    payment_status: effectivePaymentStatusFromOrderGraph(row),
  }
}

function normalizeMetadata(m: unknown): Record<string, unknown> | null {
  if (m && typeof m === "object" && !Array.isArray(m)) return m as Record<string, unknown>
  return null
}

function summarizeListRow(row: OpsOrderRow, slaDeliveryDays: number, metadata: unknown) {
  const created = new Date(row.created_at)
  const hasCreated = !Number.isNaN(created.getTime())
  const slaDeadline = hasCreated ? computeSlaDeadlineUtc(created, slaDeliveryDays) : null
  return {
    id: row.id,
    display_id: row.display_id,
    friendly: friendlyDisplayId(row.display_id),
    email: row.email,
    created_at: row.created_at,
    updated_at: row.updated_at,
    status: row.status,
    currency_code: row.currency_code,
    total: row.total,
    fulfillment_status: row.fulfillment_status,
    payment_status: row.payment_status,
    sla_deadline: slaDeadline ? slaDeadline.toISOString() : null,
    sla_deadline_day_utc: slaDeadline ? utcYmd(slaDeadline) : null,
    metadata: normalizeMetadata(metadata),
  }
}

function summarizeFromRaw(raw: Record<string, unknown>, slaDeliveryDays: number) {
  return summarizeListRow(toOpsRow(raw), slaDeliveryDays, raw.metadata)
}

function isCanceledMedusaOrder(status: string | null | undefined): boolean {
  if (!status) return false
  const s = status.toLowerCase()
  return s === "canceled" || s === "cancelled"
}

async function loadOrderRowsBatched(
  query: { graph: (args: Record<string, unknown>) => Promise<{ data?: unknown[] }> },
  fields: string[],
  opts: { mode: "all" | "page"; skip: number; take: number; maxOrders: number; batchSize: number },
): Promise<{ rows: Record<string, unknown>[]; truncated: boolean; batches: number }> {
  if (opts.mode === "page") {
    const { data } = await query.graph({
      entity: "order",
      fields,
      pagination: {
        skip: opts.skip,
        take: opts.take,
        order: { created_at: "DESC" },
      },
    })
    const rows = ((data || []) as Record<string, unknown>[]).filter((r) => String(r.id ?? "").length > 0)
    return { rows, truncated: false, batches: 1 }
  }

  const out: Record<string, unknown>[] = []
  let skipCursor = 0
  let batches = 0
  let truncated = false

  while (out.length < opts.maxOrders) {
    const take = Math.min(opts.batchSize, opts.maxOrders - out.length)
    const { data } = await query.graph({
      entity: "order",
      fields,
      pagination: {
        skip: skipCursor,
        take,
        order: { created_at: "DESC" },
      },
    })
    batches += 1
    const batch = ((data || []) as Record<string, unknown>[]).filter((r) => String(r.id ?? "").length > 0)
    out.push(...batch)
    if (batch.length < take) break
    skipCursor += take
    if (out.length >= opts.maxOrders) {
      truncated = true
      break
    }
  }

  return { rows: out, truncated, batches }
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  if (!assertOpsBackendAccess(req, res)) return

  const listMax = listMaxFromEnv()
  const maxOrders = dashboardMaxOrdersFromEnv()
  const batchSize = dashboardBatchFromEnv()
  const fetchMode = parseFetchMode(req.query.mode)
  const includeGraph = parseBoolQuery(req.query.include_graph, true)

  const skip = parseIntParam(req.query.skip, 0, 100_000)
  const take =
    fetchMode === "page"
      ? parseIntParam(req.query.take, 50, listMax)
      : Math.min(batchSize, maxOrders)

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as {
    graph: (args: Record<string, unknown>) => Promise<{ data?: unknown[] }>
  }
  const config = readOpsClassifyConfigFromEnv()

  const fields = [
    ...(includeGraph ? ORDER_OPS_GRAPH_FIELDS : ORDER_OPS_CORE_FIELDS),
    ...ORDER_OPS_PAYMENT_DETECT_FIELDS,
    ...DASHBOARD_ORDER_EXTRA_FIELDS,
  ]

  try {
    const { rows: rowsRaw, truncated, batches } = await loadOrderRowsBatched(query, fields, {
      mode: fetchMode,
      skip,
      take,
      maxOrders,
      batchSize,
    })

    const rowsRawValid = rowsRaw.filter((r) => {
      const o = toOpsRow(r)
      return o.id.length > 0 && o.created_at.length > 0
    })
    const droppedMissingCreated = rowsRaw.length - rowsRawValid.length

    const rows = rowsRawValid.map((r) => toOpsRow(r))

    const classified = classifyOpsOrders(rows, config, new Date())

    const sd = config.slaDeliveryDays

    const rawById = new Map(rowsRawValid.map((r) => [String(r.id ?? ""), r]))

    const instapayAwaitingCapture: Record<string, unknown>[] = []
    const instapayAwaitingShipment: Record<string, unknown>[] = []
    for (const raw of rowsRawValid) {
      if (isCanceledMedusaOrder(typeof raw.status === "string" ? raw.status : null)) continue
      if (!orderUsesInstapayPayment(raw)) continue
      const ps = effectivePaymentStatusFromOrderGraph(raw)
      if (!isPaymentCaptured(ps)) {
        instapayAwaitingCapture.push(raw)
        continue
      }
      const fs = effectiveFulfillmentStatusFromOrderGraph(raw)
      if (!isDeliveredFulfillment(fs)) {
        instapayAwaitingShipment.push(raw)
      }
    }

    const order_graphs: Record<string, Record<string, unknown>> = {}
    if (includeGraph) {
      for (const raw of rowsRawValid) {
        const id = String(raw.id ?? "")
        if (id) order_graphs[id] = raw
      }
    }

    const metaNote =
      fetchMode === "all"
        ? `Loaded orders in ${batches} batch(es) (newest first). SLA buckets use every order returned up to HORO_OPS_DASHBOARD_MAX_ORDERS (${maxOrders}).${
            truncated ? " Results were truncated at the cap." : ""
          } When include_graph=1, order_graphs holds the full Medusa graph payload per order id (metadata, items, addresses, totals, shipping_methods).`
        : `Figures use only this page (skip=${skip}, take=${take}). For all orders, call with mode=all.`

    res.status(200).json({
      meta: {
        fetch_mode: fetchMode,
        skip: fetchMode === "page" ? skip : 0,
        take: fetchMode === "page" ? take : rows.length,
        raw_rows: rowsRaw.length,
        dropped_missing_created_at: droppedMissingCreated,
        loaded: rows.length,
        list_max: listMax,
        max_orders: maxOrders,
        batch_size: batchSize,
        batches,
        truncated,
        include_graph: includeGraph,
        order_graph_count: includeGraph ? Object.keys(order_graphs).length : 0,
        classify_config: config,
        delivery_schedule_utc_day: classified.deliveryScheduleUtcDay,
        note: metaNote,
      },
      ...(includeGraph ? { order_graphs } : {}),
      delivery: {
        due_today: classified.deliveryDueToday.map((r) => {
          const raw = rawById.get(r.id)
          return summarizeListRow(r, sd, raw?.metadata)
        }),
        due_tomorrow: classified.deliveryDueTomorrow.map((r) => {
          const raw = rawById.get(r.id)
          return summarizeListRow(r, sd, raw?.metadata)
        }),
        due_in_2_to_3_days: classified.deliveryDueIn2To3Days.map((r) => {
          const raw = rawById.get(r.id)
          return summarizeListRow(r, sd, raw?.metadata)
        }),
      },
      instapayAwaitingCapture: instapayAwaitingCapture.map((raw) => summarizeFromRaw(raw, sd)),
      instapayAwaitingShipment: instapayAwaitingShipment.map((raw) => summarizeFromRaw(raw, sd)),
      list: rowsRawValid.map((raw) => summarizeFromRaw(raw, sd)),
      dueSoon: classified.dueSoon.map((r) => {
        const raw = rawById.get(r.id)
        return summarizeListRow(r, sd, raw?.metadata)
      }),
      deliveredRecently: classified.deliveredRecently.map((r) => {
        const raw = rawById.get(r.id)
        return summarizeListRow(r, sd, raw?.metadata)
      }),
      moneyCollected: {
        by_currency: classified.moneyCollectedByCurrency,
        orders: classified.moneyCollectedOrders.map((r) => {
          const raw = rawById.get(r.id)
          return summarizeListRow(r, sd, raw?.metadata)
        }),
      },
      alarms: classified.alarms,
      today: classified.today,
    })
  } catch (e) {
    res.status(500).json({
      message: e instanceof Error ? e.message : "Dashboard query failed",
    })
  }
}
