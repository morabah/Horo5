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

function firstStringValue(values: unknown[]): string {
  return values.map(stringValue).find(Boolean) ?? ""
}

function truthySignal(value: unknown): boolean {
  if (value === true) return true
  if (typeof value === "number") return value > 0
  const raw = stringValue(value)
  return ["1", "true", "yes", "high", "confirmed", "opted_in"].includes(raw)
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

function deliveryAreaQuality(order: Record<string, unknown>): OrderQualityFactor {
  const meta = orderMetadata(order)
  const address: Record<string, unknown> = isRecord(order.shipping_address)
    ? order.shipping_address
    : isRecord(order.shippingAddress)
      ? order.shippingAddress
      : {}
  const risk = firstStringValue([meta.rtoRisk, meta.rto_risk, meta.deliveryRisk, meta.delivery_risk, meta.areaRisk])

  if (/high|remote|rto|unreachable|unclear/.test(risk)) {
    return { key: "delivery_area_quality", score: 1, reason: risk }
  }
  if (/medium|manual|verify/.test(risk)) {
    return { key: "delivery_area_quality", score: 3, reason: risk }
  }

  const area = firstStringValue([
    meta.deliveryArea,
    meta.delivery_area,
    meta.shippingCity,
    meta.shipping_city,
    address.city,
    address.province,
    address.address_1,
  ])
  if (area) {
    return { key: "delivery_area_quality", score: 5, reason: area }
  }
  return { key: "delivery_area_quality", score: 1, reason: "missing delivery area" }
}

function sizeConfidenceQuality(order: Record<string, unknown>): OrderQualityFactor {
  const meta = orderMetadata(order)
  const confidenceRaw = meta.sizeConfidence ?? meta.size_confidence ?? meta.sizeConfidenceScore ?? meta.size_confidence_score

  if (typeof confidenceRaw === "number" && Number.isFinite(confidenceRaw)) {
    if (confidenceRaw >= 4 || confidenceRaw >= 0.75) {
      return { key: "size_confidence", score: 5, reason: String(confidenceRaw) }
    }
    if (confidenceRaw > 0) {
      return { key: "size_confidence", score: 3, reason: String(confidenceRaw) }
    }
  }

  const confidence = stringValue(confidenceRaw)
  if (/high|confident|confirmed|recommended|helped|true|yes/.test(confidence)) {
    return { key: "size_confidence", score: 5, reason: confidence }
  }
  if (/medium|selected|ok|standard|usual/.test(confidence)) {
    return { key: "size_confidence", score: 3, reason: confidence }
  }
  if (/low|unclear|unknown|help_needed|not_sure/.test(confidence)) {
    return { key: "size_confidence", score: 1, reason: confidence }
  }

  const itemMetas = collectItemMetadata(order)
  const hasSizeSignal = itemMetas.some((itemMeta) =>
    Boolean(
      firstStringValue([
        itemMeta.selectedSize,
        itemMeta.selected_size,
        itemMeta.recommendedSize,
        itemMeta.recommended_size,
        itemMeta.preferredDefaultSize,
        itemMeta.preferred_default_size,
        itemMeta.size,
      ]),
    ),
  )
  if (hasSizeSignal) {
    return { key: "size_confidence", score: 3, reason: "selected size present" }
  }

  return { key: "size_confidence", score: 1, reason: "missing size signal" }
}

function ugcPotentialQuality(order: Record<string, unknown>): OrderQualityFactor {
  const meta = orderMetadata(order)
  const itemMetas = collectItemMetadata(order)

  if (
    truthySignal(meta.ugcPotential) ||
    truthySignal(meta.ugc_potential) ||
    truthySignal(meta.shareIntent) ||
    truthySignal(meta.share_intent) ||
    itemMetas.some((itemMeta) => truthySignal(itemMeta.ugcPotential) || truthySignal(itemMeta.ugc_potential))
  ) {
    return { key: "ugc_potential", score: 5, reason: "explicit UGC/share signal" }
  }

  if (truthySignal(meta.whatsapp_opt_in) || truthySignal(meta.marketing_opt_in)) {
    return { key: "ugc_potential", score: 3, reason: "contact opt-in" }
  }

  if (
    itemMetas.some((itemMeta) =>
      itemMeta.giftable === true ||
      (Array.isArray(itemMeta.giftOccasionTags) && itemMeta.giftOccasionTags.length > 0),
    )
  ) {
    return { key: "ugc_potential", score: 3, reason: "giftable product" }
  }

  return { key: "ugc_potential", score: 1, reason: "no UGC signal" }
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
    deliveryAreaQuality(order),
    sizeConfidenceQuality(order),
    ugcPotentialQuality(order),
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
