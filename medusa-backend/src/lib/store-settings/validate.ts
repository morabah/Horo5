import type {
  DeliveryConfig,
  SizeTable,
  SizeTableFitModel,
  SizeTableMeasurement,
  StoreSettings,
  StoreSettingsResult,
  StoreSettingsValidationIssue,
} from "./types"

const TABLE_KEY_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/

type IntRule = {
  key: keyof DeliveryConfig
  min: number
  max: number
}

const DELIVERY_INT_RULES: IntRule[] = [
  { key: "standardMinDays", min: 1, max: 30 },
  { key: "standardMaxDays", min: 1, max: 30 },
  { key: "expressMinDays", min: 1, max: 30 },
  { key: "expressMaxDays", min: 1, max: 30 },
  { key: "cutoffHourLocal", min: 0, max: 23 },
  { key: "cutoffMinuteLocal", min: 0, max: 59 },
  { key: "standardMaxBusinessDays", min: 1, max: 30 },
]

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function trimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function parseInteger(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value)
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? Math.trunc(parsed) : null
  }
  return null
}

function addIssue(issues: StoreSettingsValidationIssue[], field: string, message: string) {
  issues.push({ field, message })
}

function normalizeDelivery(raw: unknown, issues: StoreSettingsValidationIssue[]): DeliveryConfig | null {
  const record = asRecord(raw)
  if (!record) {
    addIssue(issues, "delivery", "Delivery config must be an object.")
    return null
  }

  const delivery = {} as DeliveryConfig
  for (const rule of DELIVERY_INT_RULES) {
    const value = parseInteger(record[rule.key])
    if (value === null || value < rule.min || value > rule.max) {
      addIssue(issues, `delivery.${rule.key}`, `${rule.key} must be a whole number from ${rule.min} to ${rule.max}.`)
      continue
    }
    delivery[rule.key] = value as never
  }

  const jsonLdShipping = record.jsonLdStandardShippingEgp ?? record.json_ld_standard_shipping_egp
  if (jsonLdShipping !== undefined && jsonLdShipping !== null && jsonLdShipping !== "") {
    const value = parseInteger(jsonLdShipping)
    if (value === null || value < 0 || value > 500_000) {
      addIssue(issues, "delivery.jsonLdStandardShippingEgp", "jsonLdStandardShippingEgp must be a non-negative whole EGP amount.")
    } else {
      delivery.jsonLdStandardShippingEgp = value
    }
  }

  if (delivery.standardMinDays > delivery.standardMaxDays) {
    addIssue(issues, "delivery.standardMaxDays", "standardMaxDays must be greater than or equal to standardMinDays.")
  }
  if (delivery.expressMinDays > delivery.expressMaxDays) {
    addIssue(issues, "delivery.expressMaxDays", "expressMaxDays must be greater than or equal to expressMinDays.")
  }
  if (delivery.standardMaxBusinessDays < delivery.standardMinDays) {
    addIssue(issues, "delivery.standardMaxBusinessDays", "standardMaxBusinessDays must be greater than or equal to standardMinDays.")
  }

  return delivery
}

function normalizeMeasurement(raw: unknown, field: string, issues: StoreSettingsValidationIssue[]): SizeTableMeasurement | null {
  const record = asRecord(raw)
  if (!record) {
    addIssue(issues, field, "Measurement row must be an object.")
    return null
  }

  const row: SizeTableMeasurement = {
    size: trimmedString(record.size),
    chest: trimmedString(record.chest),
    shoulder: trimmedString(record.shoulder),
    length: trimmedString(record.length),
    sleeve: trimmedString(record.sleeve),
  }

  for (const [key, value] of Object.entries(row)) {
    if (!value) {
      addIssue(issues, `${field}.${key}`, `${key} is required.`)
    }
  }

  return row
}

function normalizeFitModel(raw: unknown, field: string, issues: StoreSettingsValidationIssue[]): SizeTableFitModel | null {
  const record = asRecord(raw)
  if (!record) {
    addIssue(issues, field, "Fit model must be an object.")
    return null
  }

  const heightCm = parseInteger(record.heightCm)
  if (heightCm === null || heightCm < 80 || heightCm > 250) {
    addIssue(issues, `${field}.heightCm`, "heightCm must be a whole number from 80 to 250.")
  }

  const model: SizeTableFitModel = {
    heightCm: heightCm ?? 0,
    heightImperial: trimmedString(record.heightImperial),
    sizeWorn: trimmedString(record.sizeWorn),
  }
  const fitNote = trimmedString(record.fitNote)
  if (fitNote) {
    model.fitNote = fitNote
  }

  if (!model.heightImperial) {
    addIssue(issues, `${field}.heightImperial`, "heightImperial is required.")
  }
  if (!model.sizeWorn) {
    addIssue(issues, `${field}.sizeWorn`, "sizeWorn is required.")
  }

  return model
}

function normalizeSizeTables(raw: unknown, issues: StoreSettingsValidationIssue[]): Record<string, SizeTable> {
  const wrapper = asRecord(raw)
  const record = asRecord(wrapper?.tables) ?? wrapper
  if (!record) {
    addIssue(issues, "sizeTables", "Size tables must be an object keyed by preset key.")
    return {}
  }

  const out: Record<string, SizeTable> = {}
  for (const [rawKey, rawTable] of Object.entries(record)) {
    const key = rawKey.trim()
    const field = `sizeTables.${key || rawKey}`
    if (!key) {
      addIssue(issues, "sizeTables", "Size table keys cannot be blank.")
      continue
    }
    if (!TABLE_KEY_PATTERN.test(key)) {
      addIssue(issues, field, "Size table keys must use lowercase letters, numbers, dashes, or underscores.")
      continue
    }
    if (out[key]) {
      addIssue(issues, field, `Duplicate size table key "${key}".`)
      continue
    }

    const tableRecord = asRecord(rawTable)
    if (!tableRecord) {
      addIssue(issues, field, "Size table must be an object.")
      continue
    }

    const measurementsRaw = tableRecord.measurements
    if (!Array.isArray(measurementsRaw) || measurementsRaw.length === 0) {
      addIssue(issues, `${field}.measurements`, "At least one measurement row is required.")
    }
    const measurements = Array.isArray(measurementsRaw)
      ? measurementsRaw
          .map((row, index) => normalizeMeasurement(row, `${field}.measurements.${index}`, issues))
          .filter((row): row is SizeTableMeasurement => row !== null)
      : []

    const fitModelsRaw = tableRecord.fitModels
    if (fitModelsRaw !== undefined && !Array.isArray(fitModelsRaw)) {
      addIssue(issues, `${field}.fitModels`, "fitModels must be an array.")
    }
    const fitModels = Array.isArray(fitModelsRaw)
      ? fitModelsRaw
          .map((model, index) => normalizeFitModel(model, `${field}.fitModels.${index}`, issues))
          .filter((model): model is SizeTableFitModel => model !== null)
      : []

    out[key] = { measurements, fitModels }
  }

  if (Object.keys(out).length === 0) {
    addIssue(issues, "sizeTables", "At least one size table is required.")
  }

  return out
}

function normalizeStorefrontUrl(raw: unknown, issues: StoreSettingsValidationIssue[]): string | null {
  const value = trimmedString(raw)
  if (!value) return null

  try {
    const url = new URL(value)
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      addIssue(issues, "storefrontUrl", "Storefront URL must start with http:// or https://.")
      return null
    }
    return url.toString().replace(/\/+$/, "")
  } catch {
    addIssue(issues, "storefrontUrl", "Storefront URL must be a valid URL.")
    return null
  }
}

export function normalizeStoreSettingsInput(raw: unknown): StoreSettingsResult {
  const issues: StoreSettingsValidationIssue[] = []
  const record = asRecord(raw)
  if (!record) {
    return {
      ok: false,
      issues: [{ field: "settings", message: "Store settings payload must be an object." }],
    }
  }

  const delivery = normalizeDelivery(record.delivery, issues)
  const sizeTables = normalizeSizeTables(record.sizeTables, issues)
  const defaultSizeTableKey = trimmedString(record.defaultSizeTableKey)
  if (!defaultSizeTableKey) {
    addIssue(issues, "defaultSizeTableKey", "Default size table key is required.")
  } else if (!sizeTables[defaultSizeTableKey]) {
    addIssue(issues, "defaultSizeTableKey", "Default size table key must reference an existing size table.")
  }

  const storefrontUrl = normalizeStorefrontUrl(record.storefrontUrl, issues)

  if (issues.length > 0 || !delivery) {
    return { ok: false, issues }
  }

  return {
    ok: true,
    settings: {
      delivery,
      sizeTables,
      defaultSizeTableKey,
      storefrontUrl,
    },
  }
}
