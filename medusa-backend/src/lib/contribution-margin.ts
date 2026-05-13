import { medusaAmountToEgp } from "./egp-amount"

export type ContributionMarginBreakdown = {
  sellingPriceEgp: number
  blankCostEgp: number
  printCostEgp: number
  packagingCostEgp: number
  shippingSubsidyEgp: number
  paymentFeeEgp: number
  estimatedCpaEgp: number
  rtoAllowanceEgp: number
}

export type ContributionMarginResult = {
  contributionMarginEgp: number
  breakdown: ContributionMarginBreakdown
  warnings: string[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function numberFromUnknown(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function envDefault(key: string): number | null {
  return numberFromUnknown(process.env[key])
}

function metadataNumber(metadata: Record<string, unknown>, key: keyof ContributionMarginBreakdown): number | null {
  return numberFromUnknown(metadata[key])
}

function lineQuantity(line: Record<string, unknown>): number {
  const candidates = [
    line.quantity,
    isRecord(line.detail) ? line.detail.quantity : undefined,
    isRecord(line.item) ? line.item.quantity : undefined,
  ]
  for (const candidate of candidates) {
    const parsed = numberFromUnknown(candidate)
    if (parsed !== null && parsed > 0) return Math.max(1, Math.floor(parsed))
  }
  return 1
}

function lineMetadata(line: Record<string, unknown>): Record<string, unknown> {
  const item = isRecord(line.item) ? line.item : {}
  const product = isRecord(item.product) ? item.product : isRecord(line.product) ? line.product : {}
  const variant = isRecord(item.variant) ? item.variant : isRecord(line.variant) ? line.variant : {}
  return {
    ...(isRecord(product.metadata) ? product.metadata : {}),
    ...(isRecord(variant.metadata) ? variant.metadata : {}),
    ...(isRecord(item.metadata) ? item.metadata : {}),
    ...(isRecord(line.metadata) ? line.metadata : {}),
  }
}

function sumItemCost(
  order: Record<string, unknown>,
  key: keyof ContributionMarginBreakdown,
  envKey: string,
): { value: number; missing: boolean } {
  const lines = Array.isArray(order.items) ? order.items.filter(isRecord) : []
  const fallback = envDefault(envKey)
  if (!lines.length) {
    return { value: fallback ?? 0, missing: fallback === null }
  }

  let total = 0
  let missing = false
  for (const line of lines) {
    const meta = lineMetadata(line)
    const value = metadataNumber(meta, key) ?? fallback
    if (value === null) {
      missing = true
      continue
    }
    total += value * lineQuantity(line)
  }
  return { value: total, missing }
}

function orderLevelCost(
  orderMetadata: Record<string, unknown>,
  key: keyof ContributionMarginBreakdown,
  envKey: string,
): { value: number; missing: boolean } {
  const value = metadataNumber(orderMetadata, key) ?? envDefault(envKey)
  return { value: value ?? 0, missing: value === null }
}

export function calculateContributionMargin(order: Record<string, unknown>): ContributionMarginResult {
  const metadata = isRecord(order.metadata) ? order.metadata : {}
  const sellingPriceEgp =
    metadataNumber(metadata, "sellingPriceEgp") ??
    medusaAmountToEgp(order.subtotal ?? order.total ?? order.summary)

  const blank = sumItemCost(order, "blankCostEgp", "HORO_DEFAULT_BLANK_COST_EGP")
  const print = sumItemCost(order, "printCostEgp", "HORO_DEFAULT_PRINT_COST_EGP")
  const packaging = orderLevelCost(metadata, "packagingCostEgp", "HORO_DEFAULT_PACKAGING_COST_EGP")
  const shipping = orderLevelCost(metadata, "shippingSubsidyEgp", "HORO_DEFAULT_SHIPPING_SUBSIDY_EGP")
  const paymentFee = orderLevelCost(metadata, "paymentFeeEgp", "HORO_DEFAULT_PAYMENT_FEE_EGP")
  const cpa = orderLevelCost(metadata, "estimatedCpaEgp", "HORO_DEFAULT_ESTIMATED_CPA_EGP")
  const rto = orderLevelCost(metadata, "rtoAllowanceEgp", "HORO_DEFAULT_RTO_ALLOWANCE_EGP")

  const warnings = new Set<string>()
  for (const cost of [blank, print, packaging, shipping, paymentFee, cpa, rto]) {
    if (cost.missing) warnings.add("missing_cost_data")
  }
  if (shipping.value > sellingPriceEgp * 0.2) warnings.add("high_shipping_subsidy")
  if (cpa.value > sellingPriceEgp * 0.25) warnings.add("high_cpa")

  const breakdown: ContributionMarginBreakdown = {
    sellingPriceEgp,
    blankCostEgp: blank.value,
    printCostEgp: print.value,
    packagingCostEgp: packaging.value,
    shippingSubsidyEgp: shipping.value,
    paymentFeeEgp: paymentFee.value,
    estimatedCpaEgp: cpa.value,
    rtoAllowanceEgp: rto.value,
  }

  const contributionMarginEgp =
    sellingPriceEgp -
    breakdown.blankCostEgp -
    breakdown.printCostEgp -
    breakdown.packagingCostEgp -
    breakdown.shippingSubsidyEgp -
    breakdown.paymentFeeEgp -
    breakdown.estimatedCpaEgp -
    breakdown.rtoAllowanceEgp

  if (contributionMarginEgp < 0) warnings.add("negative_margin")

  return {
    contributionMarginEgp,
    breakdown,
    warnings: [...warnings],
  }
}
