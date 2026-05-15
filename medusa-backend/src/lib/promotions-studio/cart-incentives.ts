import { BUNDLE_CODE_PREFIX } from "../shared/constants"

export type LocalizedPromoLabel = string | { en?: string; ar?: string }

export type BundlePromotionConfig = {
  code: string
  applicationMethod: {
    type: "fixed" | "percentage"
    target_type: "items"
    allocation: "each"
    value: number
    currency_code: "egp"
    buy_rules_min_quantity: number
    apply_to_quantity: number
    max_quantity: number
    buy_rules: PromotionRuleInput[]
    target_rules: PromotionRuleInput[]
  }
}

type PromotionRuleInput = {
  attribute: string
  operator: "ne"
  values: string[]
}

function positiveInteger(value: unknown): number | null {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  return Math.trunc(parsed)
}

export function cleanPromoLabel(value: unknown): LocalizedPromoLabel | null {
  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed ? trimmed : null
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const raw = value as Record<string, unknown>
    const en = typeof raw.en === "string" && raw.en.trim() ? raw.en.trim() : undefined
    const ar = typeof raw.ar === "string" && raw.ar.trim() ? raw.ar.trim() : undefined
    if (!en && !ar) return null
    return { ...(en ? { en } : {}), ...(ar ? { ar } : {}) }
  }
  return null
}

export function describeUnknownError(err: unknown): string {
  if (err instanceof Error && err.message) return err.message
  if (err && typeof err === "object") {
    const maybeMessage = (err as { message?: unknown }).message
    if (typeof maybeMessage === "string" && maybeMessage.trim()) {
      return maybeMessage
    }
    try {
      return JSON.stringify(err)
    } catch {
      return String(err)
    }
  }
  return String(err)
}

export function buildBundlePromotionConfig(body: Record<string, unknown>): BundlePromotionConfig {
  const requireQuantity = positiveInteger(body.requireQuantity) ?? 2
  const applyToQuantity = positiveInteger(body.applyToQuantity) ?? 1
  const applicationKind = body.applicationKind === "fixed" ? "fixed" : "percentage"
  const applicationValue = positiveInteger(body.applicationValue) ?? 100
  const code = `${BUNDLE_CODE_PREFIX}_${requireQuantity}_${applyToQuantity}_${applicationKind.toUpperCase()}_${applicationValue}`
  const allDiscountableItemsRule: PromotionRuleInput = {
    attribute: "items.product.id",
    operator: "ne",
    values: ["__horo_no_product__"],
  }
  const cloneRule = (rule: PromotionRuleInput): PromotionRuleInput => ({
    ...rule,
    values: [...rule.values],
  })

  return {
    code,
    applicationMethod: {
      type: applicationKind,
      target_type: "items",
      allocation: "each",
      value: applicationValue,
      currency_code: "egp",
      buy_rules_min_quantity: requireQuantity,
      apply_to_quantity: applyToQuantity,
      max_quantity: applyToQuantity,
      buy_rules: [cloneRule(allDiscountableItemsRule)],
      target_rules: [cloneRule(allDiscountableItemsRule)],
    },
  }
}
