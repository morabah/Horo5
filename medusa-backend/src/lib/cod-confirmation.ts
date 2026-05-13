export const COD_CONFIRMATION_STATUSES = [
  "not_required",
  "pending",
  "confirmed",
  "failed",
  "unreachable",
] as const

export type CodConfirmationStatus = (typeof COD_CONFIRMATION_STATUSES)[number]
export type CodConfirmedBy = "whatsapp" | "manual_admin"

export type CodConfirmationMetadata = {
  codConfirmationStatus: CodConfirmationStatus
  codConfirmedAt?: string
  codConfirmedBy?: CodConfirmedBy
  codConfirmationAttempts: number
}

const COD_CONFIRMATION_STATUS_SET = new Set<string>(COD_CONFIRMATION_STATUSES)

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}

function providerIdIncludesCod(providerId: unknown): boolean {
  if (typeof providerId !== "string") return false
  const value = providerId.toLowerCase()
  return value.includes("system_default") || value.includes("cod") || value.includes("cash")
}

export function orderUsesCodPayment(order: Record<string, unknown>): boolean {
  const cols = order.payment_collections
  if (!Array.isArray(cols)) return false
  for (const col of cols) {
    if (!isRecord(col)) continue
    for (const key of ["payment_sessions", "payments"] as const) {
      const rows = col[key]
      if (!Array.isArray(rows)) continue
      for (const row of rows) {
        if (isRecord(row) && providerIdIncludesCod(row.provider_id)) {
          return true
        }
      }
    }
  }
  return false
}

export function isCodConfirmationStatus(value: unknown): value is CodConfirmationStatus {
  return typeof value === "string" && COD_CONFIRMATION_STATUS_SET.has(value)
}

export function readCodConfirmationMetadata(order: Record<string, unknown>): CodConfirmationMetadata {
  const metadata = isRecord(order.metadata) ? order.metadata : {}
  const rawStatus = metadata.codConfirmationStatus
  const status = isCodConfirmationStatus(rawStatus)
    ? rawStatus
    : orderUsesCodPayment(order)
      ? "pending"
      : "not_required"
  const attemptsRaw = metadata.codConfirmationAttempts
  const attempts =
    typeof attemptsRaw === "number" && Number.isFinite(attemptsRaw) && attemptsRaw >= 0
      ? Math.floor(attemptsRaw)
      : 0
  const confirmedAt = typeof metadata.codConfirmedAt === "string" ? metadata.codConfirmedAt : undefined
  const confirmedBy =
    metadata.codConfirmedBy === "whatsapp" || metadata.codConfirmedBy === "manual_admin"
      ? metadata.codConfirmedBy
      : undefined

  return {
    codConfirmationStatus: status,
    ...(confirmedAt ? { codConfirmedAt: confirmedAt } : {}),
    ...(confirmedBy ? { codConfirmedBy: confirmedBy } : {}),
    codConfirmationAttempts: attempts,
  }
}

export function canDispatchCodOrder(order: Record<string, unknown>): { ok: true } | { ok: false; message: string } {
  if (!orderUsesCodPayment(order)) return { ok: true }
  const { codConfirmationStatus } = readCodConfirmationMetadata(order)
  if (codConfirmationStatus === "confirmed") return { ok: true }
  return {
    ok: false,
    message: "COD order must be confirmed before dispatch.",
  }
}

export function buildInitialCodConfirmationMetadata(order: Record<string, unknown>): CodConfirmationMetadata {
  const existing = readCodConfirmationMetadata(order)
  const status = orderUsesCodPayment(order) ? existing.codConfirmationStatus : "not_required"
  return {
    ...existing,
    codConfirmationStatus: status,
    codConfirmationAttempts: existing.codConfirmationAttempts,
  }
}

export function buildCodConfirmationUpdate(
  currentMetadata: Record<string, unknown>,
  nextStatus: CodConfirmationStatus,
  options: { confirmedBy?: CodConfirmedBy; now?: Date } = {},
): CodConfirmationMetadata {
  const current = readCodConfirmationMetadata({ metadata: currentMetadata })
  const attempts =
    nextStatus === "failed" || nextStatus === "unreachable" || nextStatus === "pending"
      ? current.codConfirmationAttempts + 1
      : current.codConfirmationAttempts
  const confirmedAt = nextStatus === "confirmed" ? (options.now ?? new Date()).toISOString() : undefined
  const confirmedBy = nextStatus === "confirmed" ? options.confirmedBy ?? "manual_admin" : undefined

  return {
    codConfirmationStatus: nextStatus,
    ...(confirmedAt ? { codConfirmedAt: confirmedAt } : {}),
    ...(confirmedBy ? { codConfirmedBy: confirmedBy } : {}),
    codConfirmationAttempts: attempts,
  }
}
