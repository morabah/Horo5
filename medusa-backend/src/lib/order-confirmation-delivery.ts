/**
 * Standard delivery window copy for transactional email — aligned with storefront
 * `formatDeliveryWindow` (web-next `deliveryEstimate.ts`): Egypt-local calendar day,
 * then 3–5 business days (Mon–Fri), date range in en-GB short month + day (UTC noon anchor).
 */

const EGYPT_TIME_ZONE = "Africa/Cairo"
const EGYPT_LOCAL_PARTS_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: EGYPT_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  weekday: "short",
  hourCycle: "h23",
})
const SHORT_DATE = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
})

type EgyptLocalParts = {
  day: number
  month: number
  year: number
}

function getEgyptLocalParts(from: Date): EgyptLocalParts {
  const parts = EGYPT_LOCAL_PARTS_FORMATTER.formatToParts(from)
  const lookup = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? ""

  return {
    day: Number(lookup("day")),
    month: Number(lookup("month")),
    year: Number(lookup("year")),
  }
}

function toBusinessDate(parts: Pick<EgyptLocalParts, "day" | "month" | "year">): Date {
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12, 0, 0, 0))
}

function isWeekend(d: Date): boolean {
  const day = d.getUTCDay()
  return day === 0 || day === 6
}

function addBusinessDays(from: Date, n: number): Date {
  if (n <= 0) {
    const d = new Date(from)
    d.setUTCHours(12, 0, 0, 0)
    return d
  }
  const d = new Date(from)
  d.setUTCHours(12, 0, 0, 0)
  let left = n
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + 1)
    if (!isWeekend(d)) left -= 1
  }
  return d
}

function clampInt(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo
  return Math.min(hi, Math.max(lo, Math.floor(n)))
}

function parseDeliveryDaysFromEnv(): { min: number; max: number } {
  const minRaw = parseInt(String(process.env.ORDER_CONFIRMATION_DELIVERY_MIN_DAYS ?? "").trim(), 10)
  const maxRaw = parseInt(String(process.env.ORDER_CONFIRMATION_DELIVERY_MAX_DAYS ?? "").trim(), 10)
  const min = Number.isFinite(minRaw) && minRaw > 0 ? clampInt(minRaw, 1, 30) : 3
  const max = Number.isFinite(maxRaw) && maxRaw > 0 ? clampInt(maxRaw, 1, 30) : 5
  return min > max ? { min: max, max: min } : { min, max }
}

function parseDeliveryDaysFromOrderMetadata(meta: unknown): { min: number; max: number } | null {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return null
  const delivery = (meta as Record<string, unknown>).delivery
  if (!delivery || typeof delivery !== "object" || Array.isArray(delivery)) return null
  const d = delivery as Record<string, unknown>
  const minN = typeof d.standardMinDays === "number" ? d.standardMinDays : parseInt(String(d.standardMinDays ?? ""), 10)
  const maxN = typeof d.standardMaxDays === "number" ? d.standardMaxDays : parseInt(String(d.standardMaxDays ?? ""), 10)
  if (!Number.isFinite(minN) || !Number.isFinite(maxN) || minN < 1 || maxN < 1) return null
  const min = clampInt(minN, 1, 30)
  const max = clampInt(maxN, 1, 30)
  return min > max ? { min: max, max: min } : { min, max }
}

/** e.g. "18 Apr – 24 Apr" — same shape as storefront `formatDeliveryWindow`. */
export function formatStandardDeliveryWindow(from: Date, minBusinessDays: number, maxBusinessDays: number): string {
  const base = toBusinessDate(getEgyptLocalParts(from))
  const start = addBusinessDays(base, minBusinessDays)
  const end = addBusinessDays(base, maxBusinessDays)
  return `${SHORT_DATE.format(start)} – ${SHORT_DATE.format(end)}`
}

/**
 * Human-readable estimated arrival range for confirmation email.
 * Uses `created_at` as anchor (when the customer placed the order).
 */
export function resolveEstimatedDeliveryWindowForEmail(
  createdAt: string | Date | null | undefined,
  orderMetadata?: unknown,
): string | null {
  const fromMeta = parseDeliveryDaysFromOrderMetadata(orderMetadata)
  const { min, max } = fromMeta ?? parseDeliveryDaysFromEnv()
  const d =
    typeof createdAt === "string" && createdAt.trim().length > 0
      ? new Date(createdAt)
      : createdAt instanceof Date
        ? createdAt
        : null
  if (!d || Number.isNaN(d.getTime())) return null
  return formatStandardDeliveryWindow(d, min, max)
}
