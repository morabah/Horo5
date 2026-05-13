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
import { readCodConfirmationMetadata } from "../../../../../lib/cod-confirmation"
import { calculateOrderQualityScore } from "../../../../../lib/order-quality-score"
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function summarizeListRow(row: OpsOrderRow, slaDeliveryDays: number, metadata: unknown) {
  const created = new Date(row.created_at)
  const hasCreated = !Number.isNaN(created.getTime())
  const slaDeadline = hasCreated ? computeSlaDeadlineUtc(created, slaDeliveryDays) : null
  const meta = normalizeMetadata(metadata)
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
    cod_confirmation: readCodConfirmationMetadata({ metadata: meta ?? {} }),
    metadata: meta,
  }
}

function summarizeFromRaw(raw: Record<string, unknown>, slaDeliveryDays: number) {
  const base = summarizeListRow(toOpsRow(raw), slaDeliveryDays, raw.metadata)
  const quality = calculateOrderQualityScore(raw)
  return {
    ...base,
    cod_confirmation: readCodConfirmationMetadata(raw),
    order_quality_score: quality.orderQualityScore,
    score_breakdown: quality.scoreBreakdown,
    contribution_margin_egp: quality.contributionMargin.contributionMarginEgp,
    contribution_margin_breakdown: quality.contributionMargin.breakdown,
    order_quality_warnings: quality.warnings,
  }
}

function isCanceledMedusaOrder(status: string | null | undefined): boolean {
  if (!status) return false
  const s = status.toLowerCase()
  return s === "canceled" || s === "cancelled"
}

function itemMetadataRows(order: Record<string, unknown>): Record<string, unknown>[] {
  const items = Array.isArray(order.items) ? order.items.filter(isRecord) : []
  return items.map((line) => {
    const item = isRecord(line.item) ? line.item : {}
    const product = isRecord(item.product) ? item.product : isRecord(line.product) ? line.product : {}
    const variant = isRecord(item.variant) ? item.variant : isRecord(line.variant) ? line.variant : {}
    return {
      ...(isRecord(product.metadata) ? product.metadata : {}),
      ...(isRecord(variant.metadata) ? variant.metadata : {}),
      ...(isRecord(item.metadata) ? item.metadata : {}),
      ...(isRecord(line.metadata) ? line.metadata : {}),
    }
  })
}

function firstString(values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim()
  }
  return null
}

function orderV14Signals(order: Record<string, unknown>) {
  const meta = isRecord(order.metadata) ? order.metadata : {}
  const itemMetas = itemMetadataRows(order)
  const buyerRoute = firstString([meta.buyerRoute, ...itemMetas.map((row) => row.buyerRoute)]) ?? "unknown"
  const primaryAudience = firstString([meta.primaryAudience, ...itemMetas.map((row) => row.primaryAudience)]) ?? "unknown"
  const giftable =
    meta.isGiftOrder === true ||
    meta.giftable === true ||
    itemMetas.some((row) => row.giftable === true || (Array.isArray(row.giftOccasionTags) && row.giftOccasionTags.length > 0))
  const firstWedgeEligible =
    meta.firstWedgeEligible === true ||
    itemMetas.some((row) => row.firstWedgeEligible === true) ||
    buyerRoute === "feeling" ||
    buyerRoute === "moment" ||
    buyerRoute === "gift"
  return { buyerRoute, primaryAudience, giftable, firstWedgeEligible }
}

function increment(map: Record<string, number>, key: string) {
  map[key] = (map[key] ?? 0) + 1
}

function buildFirstWedgeDashboard(rows: Record<string, unknown>[]) {
  const buyerRouteBreakdown: Record<string, number> = {}
  const primaryAudienceBreakdown: Record<string, number> = {}
  let giftableOrders = 0
  let firstWedgeEligibleOrders = 0

  for (const row of rows) {
    const signals = orderV14Signals(row)
    increment(buyerRouteBreakdown, signals.buyerRoute)
    increment(primaryAudienceBreakdown, signals.primaryAudience)
    if (signals.giftable) giftableOrders += 1
    if (signals.firstWedgeEligible) firstWedgeEligibleOrders += 1
  }

  const total = rows.length
  return {
    total_orders: total,
    giftable_orders: giftableOrders,
    giftable_order_share: total ? giftableOrders / total : 0,
    first_wedge_eligible_orders: firstWedgeEligibleOrders,
    first_wedge_eligible_order_share: total ? firstWedgeEligibleOrders / total : 0,
    buyer_route_breakdown: buyerRouteBreakdown,
    primary_audience_breakdown: primaryAudienceBreakdown,
  }
}

function buildCodDashboard(rows: Record<string, unknown>[]) {
  const counts: Record<string, number> = {
    not_required: 0,
    pending: 0,
    confirmed: 0,
    failed: 0,
    unreachable: 0,
  }
  for (const row of rows) {
    counts[readCodConfirmationMetadata(row).codConfirmationStatus] += 1
  }
  const required = counts.pending + counts.confirmed + counts.failed + counts.unreachable
  return {
    ...counts,
    required,
    confirmation_rate: required ? counts.confirmed / required : 1,
  }
}

function buildQualityDashboard(rows: Record<string, unknown>[]) {
  const scored = rows.map((row) => calculateOrderQualityScore(row))
  const count = scored.length
  const averageOrderQualityScore = count
    ? Math.round((scored.reduce((sum, row) => sum + row.orderQualityScore, 0) / count) * 10) / 10
    : 0
  const totalContributionMarginEgp = Math.round(scored.reduce((sum, row) => sum + row.contributionMargin.contributionMarginEgp, 0))
  return {
    average_order_quality_score: averageOrderQualityScore,
    total_contribution_margin_egp: totalContributionMarginEgp,
    average_contribution_margin_egp: count ? Math.round(totalContributionMarginEgp / count) : 0,
    warning_counts: scored.reduce<Record<string, number>>((acc, row) => {
      for (const warning of row.warnings) increment(acc, warning)
      return acc
    }, {}),
  }
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

function productV14Missing(row: Record<string, unknown>): string[] {
  const metadata = isRecord(row.metadata) ? row.metadata : {}
  const media = isRecord(metadata.media) ? metadata.media : {}
  const gallery = Array.isArray(media.gallery) ? media.gallery.filter(isRecord) : []
  const hasTag = (tag: string) => gallery.some((item) => item.tag === tag && typeof item.url === "string" && item.url.trim())
  const missing: string[] = []
  if (!row.title) missing.push("title")
  if (!row.handle) missing.push("handle")
  if (!metadata.story) missing.push("story")
  if (!metadata.feelingSlug) missing.push("feeling")
  if (!metadata.artistSlug) missing.push("artist")
  if (!metadata.priceEgp) missing.push("price")
  if (!metadata.sizeTableKey) missing.push("size_table")
  if (!metadata.fitLabel) missing.push("fit_label")
  if (!media.main && !row.thumbnail) missing.push("main_image")
  if (!hasTag("lifestyle")) missing.push("lifestyle_image")
  if (!hasTag("flat_lay")) missing.push("flat_lay_image")
  if (!hasTag("proof_fabric")) missing.push("fabric_proof")
  if (!hasTag("proof_print")) missing.push("print_proof")
  if (metadata.artistRightsApproved !== true) missing.push("artist_rights")
  if (metadata.artistCreditApproved !== true) missing.push("artist_credit")
  if (metadata.samplePrintApproved !== true) missing.push("sample_print")
  if (metadata.productPhotosApproved !== true) missing.push("product_photos")
  if (!metadata.buyerRoute) missing.push("buyer_route")
  if (!metadata.primaryAudience) missing.push("primary_audience")
  return missing
}

async function loadProductsMissingV14Readiness(
  query: { graph: (args: Record<string, unknown>) => Promise<{ data?: unknown[] }> },
) {
  const { data } = await query.graph({
    entity: "product",
    fields: ["id", "title", "handle", "status", "thumbnail", "metadata"],
    pagination: { take: 500, order: { updated_at: "DESC" } },
  })
  return ((data || []) as Record<string, unknown>[])
    .filter((row) => String(row.status ?? "").toLowerCase() === "published")
    .map((row) => ({
      id: String(row.id ?? ""),
      handle: String(row.handle ?? ""),
      title: String(row.title ?? ""),
      missing: productV14Missing(row),
    }))
    .filter((row) => row.missing.length > 0)
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
    const codConfirmation = buildCodDashboard(rowsRawValid)
    const firstWedge = buildFirstWedgeDashboard(rowsRawValid)
    const quality = buildQualityDashboard(rowsRawValid)
    const productsMissingV14Readiness = await loadProductsMissingV14Readiness(query)

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
      codConfirmation,
      firstWedge,
      quality,
      productsMissingV14Readiness,
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
