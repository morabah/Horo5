import { readCodConfirmationMetadata } from "./cod-confirmation"
import { calculateContributionMargin, type ContributionMarginResult } from "./contribution-margin"

export type OrderQualityFactor = {
  key: string
  score: 1 | 3 | 5
  reason: string
}

export type OrderQualityScoreResult = {
  orderQualityScore: number
  scoreBreakdown: OrderQualityFactor[]
  warnings: string[]
  contributionMargin: ContributionMarginResult
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : ""
}

function orderMetadata(order: Record<string, unknown>): Record<string, unknown> {
  return isRecord(order.metadata) ? order.metadata : {}
}

function sourceQuality(order: Record<string, unknown>): OrderQualityFactor {
  const meta = orderMetadata(order)
  const raw = [
    meta.source,
    meta.orderSource,
    meta.utm_source,
    meta.utmSource,
    meta.posthog_source,
    meta.posthogSource,
  ].map(stringValue).find(Boolean) ?? ""

  if (/organic|referral|direct|ugc|instagram/.test(raw)) {
    return { key: "source_quality", score: 5, reason: raw || "organic/referral/direct/UGC" }
  }
  if (/retarget|remarket|mixed/.test(raw)) {
    return { key: "source_quality", score: 3, reason: raw }
  }
  return { key: "source_quality", score: 1, reason: raw || "unknown source" }
}

function codQuality(order: Record<string, unknown>): OrderQualityFactor {
  const status = readCodConfirmationMetadata(order).codConfirmationStatus
  if (status === "confirmed" || status === "not_required") {
    return { key: "cod_confirmation", score: 5, reason: status }
  }
  if (status === "pending") {
    return { key: "cod_confirmation", score: 3, reason: status }
  }
  return { key: "cod_confirmation", score: 1, reason: status }
}

function collectItemMetadata(order: Record<string, unknown>): Record<string, unknown>[] {
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

function productRouteQuality(order: Record<string, unknown>): OrderQualityFactor {
  const meta = orderMetadata(order)
  const routes = [
    stringValue(meta.buyerRoute),
    ...collectItemMetadata(order).map((itemMeta) => stringValue(itemMeta.buyerRoute)),
  ].filter(Boolean)

  if (routes.some((route) => route === "feeling" || route === "moment" || route === "gift")) {
    return { key: "product_route_quality", score: 5, reason: routes.join(", ") }
  }
  if (routes.some((route) => route === "personality" || route === "artist_drop")) {
    return { key: "product_route_quality", score: 3, reason: routes.join(", ") }
  }
  return { key: "product_route_quality", score: 1, reason: routes.join(", ") || "unknown product route" }
}

function giftIntentQuality(order: Record<string, unknown>): OrderQualityFactor {
  const meta = orderMetadata(order)
  const itemMetas = collectItemMetadata(order)
  const clearIntent =
    meta.isGiftOrder === true ||
    meta.giftable === true ||
    itemMetas.some((itemMeta) => itemMeta.giftable === true || (Array.isArray(itemMeta.giftOccasionTags) && itemMeta.giftOccasionTags.length > 0))

  if (clearIntent) {
    return { key: "gift_or_self_intent", score: 5, reason: "giftable or clear gift intent" }
  }
  return { key: "gift_or_self_intent", score: 3, reason: "unknown gift intent" }
}

function marginQuality(margin: ContributionMarginResult): OrderQualityFactor {
  if (margin.warnings.includes("missing_cost_data")) {
    return { key: "margin", score: 1, reason: "unknown" }
  }
  if (margin.contributionMarginEgp >= 150) {
    return { key: "margin", score: 5, reason: "healthy" }
  }
  if (margin.contributionMarginEgp >= 0) {
    return { key: "margin", score: 3, reason: "acceptable" }
  }
  return { key: "margin", score: 1, reason: "negative" }
}

export function calculateOrderQualityScore(order: Record<string, unknown>): OrderQualityScoreResult {
  const contributionMargin = calculateContributionMargin(order)
  const scoreBreakdown = [
    sourceQuality(order),
    codQuality(order),
    productRouteQuality(order),
    giftIntentQuality(order),
    marginQuality(contributionMargin),
  ]
  const orderQualityScore =
    Math.round((scoreBreakdown.reduce((sum, factor) => sum + factor.score, 0) / scoreBreakdown.length) * 10) / 10
  const warnings = [
    ...contributionMargin.warnings,
    ...scoreBreakdown.filter((factor) => factor.score === 1).map((factor) => `low_${factor.key}`),
  ]

  return {
    orderQualityScore,
    scoreBreakdown,
    warnings: [...new Set(warnings)],
    contributionMargin,
  }
}
