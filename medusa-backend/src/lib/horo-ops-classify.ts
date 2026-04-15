/** Input row shape from `query.graph` on `order` (subset). */
export type OpsOrderRow = {
  id: string
  display_id?: number | string | null
  email?: string | null
  created_at: string
  updated_at?: string | null
  status?: string | null
  currency_code?: string | null
  total?: unknown
  fulfillment_status?: string | null
  payment_status?: string | null
}

export type OpsClassifyConfig = {
  slaDeliveryDays: number
  /** Orders whose SLA deadline falls within this many hours from `now` (and not yet shipped). */
  dueSoonHours: number
  stalePaymentHours: number
  staleFulfillmentHours: number
  /** "Delivered recently" window in days (from `updated_at` or `created_at`). */
  deliveredRecentDays: number
}

export type OpsAlarm = {
  order_id: string
  display_id: number | string | null
  friendly: string | null
  kind: OpsAlarmKind
  message: string
  severity: "warning" | "critical"
}

export type OpsAlarmKind =
  | "sla_overdue"
  | "payment_stale"
  | "fulfillment_stale"
  | "payment_pending_near_sla"

export type TodayQueueItem = {
  order_id: string
  display_id: number | string | null
  friendly: string | null
  priority: number
  reasons: string[]
}

const DELIVERED_FULFILLMENT = new Set(["fulfilled", "shipped", "delivered", "partially_delivered"])

const CAPTURED_PAYMENT = new Set(["captured", "partially_captured"])

function parseIsoDate(iso: string): Date | null {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

export function friendlyDisplayId(display_id: unknown): string | null {
  if (typeof display_id === "number" && display_id > 0) return `HORO-${Math.floor(display_id)}`
  if (typeof display_id === "string") {
    const n = parseInt(display_id.trim(), 10)
    if (Number.isFinite(n) && n > 0) return `HORO-${n}`
  }
  return null
}

export function parseOrderTotalMinor(total: unknown): number {
  if (typeof total === "number" && Number.isFinite(total)) return Math.round(total)
  if (typeof total === "string") {
    const n = parseFloat(total)
    return Number.isFinite(n) ? Math.round(n) : 0
  }
  if (total && typeof total === "object" && "numeric_" in (total as object)) {
    const v = (total as { numeric_?: unknown }).numeric_
    if (typeof v === "number" && Number.isFinite(v)) return Math.round(v)
  }
  return 0
}

export function isDeliveredFulfillment(fulfillment_status: string | null | undefined): boolean {
  if (!fulfillment_status) return false
  return DELIVERED_FULFILLMENT.has(fulfillment_status)
}

export function isPaymentCaptured(payment_status: string | null | undefined): boolean {
  if (!payment_status) return false
  return CAPTURED_PAYMENT.has(payment_status)
}

function hoursBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / (3600 * 1000)
}

/** SLA target moment: `created_at` plus `slaDeliveryDays` whole UTC calendar days. */
export function computeSlaDeadlineUtc(created: Date, slaDeliveryDays: number): Date {
  const d = new Date(created)
  d.setUTCDate(d.getUTCDate() + slaDeliveryDays)
  return d
}

/** `YYYY-MM-DD` in UTC (for grouping “due today / tomorrow / …”). */
export function utcYmd(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, "0")
  const day = String(d.getUTCDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function addUtcCalendarDaysYmd(ymd: string, deltaDays: number): string {
  const [y, mo, da] = ymd.split("-").map((x) => parseInt(x, 10))
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(da)) return ymd
  const d = new Date(Date.UTC(y, mo - 1, da))
  d.setUTCDate(d.getUTCDate() + deltaDays)
  return utcYmd(d)
}

/**
 * Classifies a batch of orders for the ops dashboard (pure; inject `now` for tests).
 */
export function classifyOpsOrders(
  rows: OpsOrderRow[],
  config: OpsClassifyConfig,
  now: Date,
): {
  dueSoon: OpsOrderRow[]
  deliveredRecently: OpsOrderRow[]
  moneyCollectedByCurrency: Record<string, number>
  moneyCollectedOrders: OpsOrderRow[]
  alarms: OpsAlarm[]
  today: TodayQueueItem[]
  /** Open orders whose SLA deadline falls on this UTC calendar day (ship/deliver by). */
  deliveryDueToday: OpsOrderRow[]
  deliveryDueTomorrow: OpsOrderRow[]
  /** SLA deadline UTC day is today+2 or today+3. */
  deliveryDueIn2To3Days: OpsOrderRow[]
  /** `YYYY-MM-DD` UTC used for the buckets above. */
  deliveryScheduleUtcDay: string
} {
  const dueSoon: OpsOrderRow[] = []
  const deliveredRecently: OpsOrderRow[] = []
  const moneyCollectedByCurrency: Record<string, number> = {}
  const moneyCollectedOrders: OpsOrderRow[] = []
  const alarms: OpsAlarm[] = []
  const deliveryDueToday: OpsOrderRow[] = []
  const deliveryDueTomorrow: OpsOrderRow[] = []
  const deliveryDueIn2To3Days: OpsOrderRow[] = []

  const dueSoonCutoff = new Date(now.getTime() + config.dueSoonHours * 3600 * 1000)
  const recentDeliveredCutoff = new Date(now.getTime() - config.deliveredRecentDays * 24 * 3600 * 1000)
  const todayYmd = utcYmd(now)
  const tomorrowYmd = addUtcCalendarDaysYmd(todayYmd, 1)
  const day2Ymd = addUtcCalendarDaysYmd(todayYmd, 2)
  const day3Ymd = addUtcCalendarDaysYmd(todayYmd, 3)

  for (const row of rows) {
    const created = parseIsoDate(row.created_at)
    if (!created) continue

    const updated = row.updated_at ? parseIsoDate(row.updated_at) : null
    const friendly = friendlyDisplayId(row.display_id)
    const deadline = computeSlaDeadlineUtc(created, config.slaDeliveryDays)
    const fulfilled = isDeliveredFulfillment(row.fulfillment_status ?? undefined)
    const captured = isPaymentCaptured(row.payment_status ?? undefined)
    const deadlineYmd = utcYmd(deadline)

    if (!fulfilled) {
      if (deadlineYmd === todayYmd) {
        deliveryDueToday.push(row)
      } else if (deadlineYmd === tomorrowYmd) {
        deliveryDueTomorrow.push(row)
      } else if (deadlineYmd === day2Ymd || deadlineYmd === day3Ymd) {
        deliveryDueIn2To3Days.push(row)
      }
    }

    if (captured) {
      moneyCollectedOrders.push(row)
      const cur = row.currency_code && typeof row.currency_code === "string" ? row.currency_code : "unknown"
      const minor = parseOrderTotalMinor(row.total)
      moneyCollectedByCurrency[cur] = (moneyCollectedByCurrency[cur] ?? 0) + minor
    }

    const activityAt = updated && updated.getTime() > created.getTime() ? updated : created
    if (fulfilled && activityAt >= recentDeliveredCutoff) {
      deliveredRecently.push(row)
    }

    if (!fulfilled && deadline > now && deadline <= dueSoonCutoff) {
      dueSoon.push(row)
    }

    if (!fulfilled && deadline < now) {
      alarms.push({
        order_id: row.id,
        display_id: row.display_id ?? null,
        friendly,
        kind: "sla_overdue",
        message: `SLA passed (${config.slaDeliveryDays}d from order) but order is not shipped/fulfilled.`,
        severity: "critical",
      })
    }

    const payStale =
      !captured &&
      hoursBetween(created, now) >= config.stalePaymentHours &&
      row.payment_status !== "canceled" &&
      row.status !== "canceled"
    if (payStale) {
      alarms.push({
        order_id: row.id,
        display_id: row.display_id ?? null,
        friendly,
        kind: "payment_stale",
        message: `No captured payment after ${config.stalePaymentHours}h.`,
        severity: "warning",
      })
    }

    if (captured && !fulfilled && hoursBetween(created, now) >= config.staleFulfillmentHours) {
      alarms.push({
        order_id: row.id,
        display_id: row.display_id ?? null,
        friendly,
        kind: "fulfillment_stale",
        message: `Payment captured but not fulfilled after ${config.staleFulfillmentHours}h.`,
        severity: "critical",
      })
    }

    if (
      !captured &&
      !fulfilled &&
      deadline <= dueSoonCutoff &&
      deadline >= now &&
      hoursBetween(now, deadline) <= 24
    ) {
      alarms.push({
        order_id: row.id,
        display_id: row.display_id ?? null,
        friendly,
        kind: "payment_pending_near_sla",
        message: "Payment still not captured with SLA deadline approaching.",
        severity: "warning",
      })
    }
  }

  const todayMap = new Map<string, TodayQueueItem>()

  function bump(row: OpsOrderRow, priority: number, reason: string) {
    const cur = todayMap.get(row.id)
    const friendly = friendlyDisplayId(row.display_id)
    if (!cur) {
      todayMap.set(row.id, {
        order_id: row.id,
        display_id: row.display_id ?? null,
        friendly,
        priority,
        reasons: [reason],
      })
      return
    }
    cur.priority = Math.max(cur.priority, priority)
    cur.reasons.push(reason)
  }

  for (const a of alarms) {
    const row = rows.find((r) => r.id === a.order_id)
    if (!row) continue
    const pr = a.severity === "critical" ? 3 : 2
    bump(row, pr, a.message)
  }

  for (const row of dueSoon) {
    bump(row, 1, "Due under SLA window (ship soon)")
  }

  const today = [...todayMap.values()].sort((a, b) => b.priority - a.priority || String(a.friendly).localeCompare(String(b.friendly)))

  return {
    dueSoon,
    deliveredRecently,
    moneyCollectedByCurrency,
    moneyCollectedOrders,
    alarms,
    today,
    deliveryDueToday,
    deliveryDueTomorrow,
    deliveryDueIn2To3Days,
    deliveryScheduleUtcDay: todayYmd,
  }
}

export function readOpsClassifyConfigFromEnv(): OpsClassifyConfig {
  const num = (raw: string | undefined, fallback: number) => {
    const n = parseInt(String(raw ?? "").trim(), 10)
    return Number.isFinite(n) && n > 0 ? n : fallback
  }

  return {
    slaDeliveryDays: num(process.env.HORO_OPS_SLA_DELIVERY_DAYS, 3),
    dueSoonHours: num(process.env.HORO_OPS_DUE_SOON_HOURS, 48),
    stalePaymentHours: num(process.env.HORO_OPS_STALE_PAYMENT_HOURS, 48),
    staleFulfillmentHours: num(process.env.HORO_OPS_STALE_FULFILLMENT_HOURS, 72),
    deliveredRecentDays: num(process.env.HORO_OPS_DELIVERED_RECENT_DAYS, 14),
  }
}
