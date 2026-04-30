export type DeliveryConfig = {
  standardMinDays: number
  standardMaxDays: number
  expressMinDays: number
  expressMaxDays: number
  cutoffHourLocal: number
  cutoffMinuteLocal: number
  standardMaxBusinessDays: number
  jsonLdStandardShippingEgp?: number | null
}

export type SizeTableMeasurement = {
  size: string
  chest: string
  shoulder: string
  length: string
  sleeve: string
}

export type SizeTableFitModel = {
  heightCm: number
  heightImperial: string
  sizeWorn: string
  fitNote?: string
}

export type SizeTable = {
  measurements: SizeTableMeasurement[]
  fitModels: SizeTableFitModel[]
}

export type StoreSettings = {
  delivery: DeliveryConfig
  sizeTables: Record<string, SizeTable>
  defaultSizeTableKey: string
  storefrontUrl: string | null
}

export type StoreSettingsValidationIssue = {
  field: string
  message: string
}

export type StoreSettingsResult =
  | {
      ok: true
      settings: StoreSettings
    }
  | {
      ok: false
      issues: StoreSettingsValidationIssue[]
    }
