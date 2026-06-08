import { Modules } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/types"
import {
  BUNDLE_CODE_PREFIX,
  FREE_SHIPPING_CODE_PREFIX,
  GIFT_WRAP_HANDLE,
} from "../shared/constants"
import { asNumber, parseInteger } from "../shared/type-guards"
import type { LocalizedText } from "./store-settings"

/**
 * Storefront-facing projection of native Medusa Promotions and the gift-wrap product.
 *
 * Source-of-truth contract:
 *   - All math (free shipping totals, bundle discounts) runs natively on the cart via
 *     auto-applied Medusa Promotions. The storefront NEVER computes incentive math itself.
 *   - This DTO is for **labels and progress UI only** — the threshold figure here mirrors
 *     the matching `PromotionRule` so a single Admin change updates both math and UI.
 *
 * Defaults: when no matching active automatic Promotion is found, fields are `null`. The
 * storefront then degrades to "no progress bar / no upsell" — never to a hardcoded number.
 */
export type StorefrontIncentivesDTO = {
  freeShipping: {
    /** Promotion id for tracing / Admin link. */
    promotionId: string
    /** Inclusive minimum cart subtotal (EGP) at which shipping becomes free. */
    thresholdEgp: number
    /** ISO currency code Medusa uses on the rule (informational). */
    currency: string
    /** Display label shown in mini-cart and cart progress bar. */
    label: LocalizedText
  } | null
  bundle: {
    promotionId: string
    /** "buyget" — the only kind currently surfaced. */
    type: "buyget"
    /** Required quantity in cart for the bundle to apply. */
    requireQuantity: number
    /** Quantity that becomes discounted/free. */
    applyToQuantity: number
    /** Application method `value`; for fixed = EGP saved per applied unit, percentage = 0–100. */
    applicationValue: number
    applicationKind: "fixed" | "percentage"
    label: LocalizedText
  } | null
  timedOffer: {
    promotionId: string
    label: LocalizedText
    startsAt: string | null
    endsAt: string
    savingsKind: "fixed" | "percentage"
    savingsValue: number
    scope: "storewide" | "collection"
  } | null
  /** Handle of the Medusa product that operators created for the gift-wrap line item. */
  giftWrapProductHandle: string | null
  /** Cached price (EGP) of the gift-wrap product so the storefront can show the toggle label without a second roundtrip. */
  giftWrapPriceEgp: number | null
  /** Operator-controlled marketing copy. Falls back to storefront i18n if null. */
  giftWrapLabel: LocalizedText | null
}

const EMPTY_INCENTIVES: StorefrontIncentivesDTO = {
  freeShipping: null,
  bundle: null,
  timedOffer: null,
  giftWrapProductHandle: null,
  giftWrapPriceEgp: null,
  giftWrapLabel: null,
}

function localizedFromMetadata(meta: Record<string, unknown> | undefined, key: string): LocalizedText | null {
  if (!meta) return null
  const raw = meta[key]
  if (typeof raw === "string" && raw.trim()) return raw.trim()
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const en = (raw as Record<string, unknown>).en
    const ar = (raw as Record<string, unknown>).ar
    const enStr = typeof en === "string" && en.trim() ? en.trim() : undefined
    const arStr = typeof ar === "string" && ar.trim() ? ar.trim() : undefined
    if (!enStr && !arStr) return null
    return { ...(enStr ? { en: enStr } : {}), ...(arStr ? { ar: arStr } : {}) }
  }
  return null
}

/**
 * Find the cart-subtotal threshold (EGP) on a free-shipping promotion. We look at:
 *   1. The promotion-level rules (`PromotionRule` with attribute `cart.subtotal`, op `gte`).
 *   2. Falls back to `metadata.thresholdEgp` if operators stored it as a hint.
 */
function readFreeShippingThresholdEgp(promotion: {
  rules?: Array<{ attribute?: string; operator?: string; values: Array<{ value?: string }> }>
  metadata?: Record<string, unknown> | null
}): number | null {
  const rule = (promotion.rules ?? []).find((r) => {
    const attr = (r.attribute ?? "").toLowerCase()
    const op = (r.operator ?? "").toLowerCase()
    return (attr === "cart.subtotal" || attr === "subtotal") && (op === "gte" || op === "gt")
  })
  if (rule) {
    const first = rule.values?.[0]?.value
    const n = parseInteger(first)
    if (n !== null && n >= 0) return Math.round(n)
  }
  const fallback = parseInteger((promotion.metadata as Record<string, unknown> | null | undefined)?.thresholdEgp)
  if (fallback !== null && fallback >= 0) return Math.round(fallback)
  return null
}

function toIsoDate(value: unknown): string | null {
  if (!value) return null
  const ms = Date.parse(String(value))
  if (!Number.isFinite(ms)) return null
  return new Date(ms).toISOString()
}

function firstIsoDate(...values: unknown[]): string | null {
  for (const value of values) {
    const iso = toIsoDate(value)
    if (iso) return iso
  }
  return null
}

function isLiveWindow(startsAt: string | null, endsAt: string, nowMs: number): boolean {
  const endsMs = Date.parse(endsAt)
  if (!Number.isFinite(endsMs) || endsMs <= nowMs) return false
  if (!startsAt) return true
  const startsMs = Date.parse(startsAt)
  return !Number.isFinite(startsMs) || startsMs <= nowMs
}

function timedOfferScope(value: unknown): "storewide" | "collection" {
  return value === "collection" ? "collection" : "storewide"
}

function timedOfferFromPromotion(
  promotion: {
    id: string
    code?: string
    metadata?: Record<string, unknown> | null
    campaign?: {
      starts_at?: Date | string | null
      ends_at?: Date | string | null
    } | null
    application_method?: {
      type?: "fixed" | "percentage"
      value?: number
    }
  },
  storeIncentiveMetadata: Record<string, unknown>,
  nowMs: number,
): StorefrontIncentivesDTO["timedOffer"] {
  const meta = promotion.metadata ?? undefined
  const preferredPromotionId =
    typeof storeIncentiveMetadata.timedOfferPromotionId === "string"
      ? storeIncentiveMetadata.timedOfferPromotionId
      : null
  const isPreferredPromotion = preferredPromotionId === promotion.id
  const startsAt = firstIsoDate(
    promotion.campaign?.starts_at,
    meta?.startsAt,
    meta?.starts_at,
    meta?.promoStartsAt,
    isPreferredPromotion ? storeIncentiveMetadata.timedOfferStartsAt : null,
  )
  const endsAt = firstIsoDate(
    promotion.campaign?.ends_at,
    meta?.endsAt,
    meta?.ends_at,
    meta?.promoEndsAt,
    isPreferredPromotion ? storeIncentiveMetadata.timedOfferEndsAt : null,
  )
  if (!endsAt || !isLiveWindow(startsAt, endsAt, nowMs)) return null

  const savingsKind = promotion.application_method?.type === "fixed" ? "fixed" : "percentage"
  const savingsValue = asNumber(promotion.application_method?.value) ?? 0
  if (!Number.isFinite(savingsValue) || savingsValue <= 0) return null

  const label =
    (isPreferredPromotion ? localizedFromMetadata(storeIncentiveMetadata, "timedOfferLabel") : null) ??
    localizedFromMetadata(meta, "timedOfferLabel") ??
    localizedFromMetadata(meta, "label") ??
    { en: "Limited-time offer", ar: "عرض لفترة محدودة" }
  const scope = timedOfferScope(
    (isPreferredPromotion ? storeIncentiveMetadata.timedOfferScope : undefined) ??
      meta?.timedOfferScope ??
      meta?.scope,
  )

  return {
    promotionId: promotion.id,
    label,
    startsAt,
    endsAt,
    savingsKind,
    savingsValue,
    scope,
  }
}

async function findGiftWrapDetails(
  scope: MedusaContainer,
): Promise<Pick<StorefrontIncentivesDTO, "giftWrapProductHandle" | "giftWrapPriceEgp" | "giftWrapLabel">> {
  try {
    const productModule = scope.resolve(Modules.PRODUCT) as {
      listProducts: (
        filters: Record<string, unknown>,
        config?: Record<string, unknown>,
      ) => Promise<
        Array<{
          handle: string
          metadata?: Record<string, unknown> | null
          variants?: Array<{
            calculated_price?: { calculated_amount?: number | string | null } | null
            metadata?: Record<string, unknown> | null
          }> | null
        }>
      >
    }
    const products = await productModule.listProducts(
      { handle: GIFT_WRAP_HANDLE },
      { take: 1, relations: ["variants"] },
    )
    const product = products[0]
    if (!product) {
      return { giftWrapProductHandle: null, giftWrapPriceEgp: null, giftWrapLabel: null }
    }
    const meta = product.metadata ?? {}
    const priceFromMeta = asNumber(meta.priceEgp)
    const priceFromVariant = asNumber(product.variants?.[0]?.calculated_price?.calculated_amount ?? null)
    const giftWrapPriceEgp = priceFromMeta ?? priceFromVariant ?? null
    return {
      giftWrapProductHandle: product.handle,
      giftWrapPriceEgp,
      giftWrapLabel: localizedFromMetadata(meta as Record<string, unknown>, "giftWrapLabel"),
    }
  } catch {
    return { giftWrapProductHandle: null, giftWrapPriceEgp: null, giftWrapLabel: null }
  }
}

/** Read free-shipping threshold from store metadata when no active promotion exists. */
async function findStoreFreeShippingThresholdEgp(
  scope: MedusaContainer,
): Promise<number | null> {
  try {
    const storeModule = scope.resolve(Modules.STORE) as {
      listStores: () => Promise<Array<{ metadata?: Record<string, unknown> | null }>>
    }
    const stores = await storeModule.listStores()
    const meta = stores[0]?.metadata ?? {}
    const raw = meta.freeShippingThresholdEgp ?? meta.free_shipping_threshold_egp
    const parsed = asNumber(raw)
    if (parsed !== undefined && parsed >= 0) return Math.round(parsed)
    return null
  } catch {
    return null
  }
}

async function findStoreIncentiveMetadata(
  scope: MedusaContainer,
): Promise<Record<string, unknown>> {
  try {
    const storeModule = scope.resolve(Modules.STORE) as {
      listStores: () => Promise<Array<{ metadata?: Record<string, unknown> | null }>>
    }
    const stores = await storeModule.listStores()
    return stores[0]?.metadata ?? {}
  } catch {
    return {}
  }
}

/**
 * Read every active automatic Promotion and project the first matching free-shipping and bundle promo.
 * The storefront treats `null` as "feature disabled" and renders nothing — never invents fallbacks.
 */
export async function retrieveStorefrontIncentivesPayload(scope: MedusaContainer): Promise<StorefrontIncentivesDTO> {
  const storeIncentiveMetadata = await findStoreIncentiveMetadata(scope)
  let promotions: Array<{
    id: string
    code?: string
    type?: "standard" | "buyget"
    status?: "draft" | "active" | "inactive"
    is_automatic?: boolean
    metadata?: Record<string, unknown> | null
    campaign_id?: string | null
    campaign?: {
      starts_at?: Date | string | null
      ends_at?: Date | string | null
    } | null
    rules?: Array<{ attribute?: string; operator?: string; values: Array<{ value?: string }> }>
    application_method?: {
      type?: "fixed" | "percentage"
      target_type?: "order" | "shipping_methods" | "items"
      value?: number
      currency_code?: string
      buy_rules_min_quantity?: number | null
      apply_to_quantity?: number | null
    }
  }> = []
  try {
    const promotionModule = scope.resolve(Modules.PROMOTION) as {
      listPromotions: (
        filters: Record<string, unknown>,
        config: Record<string, unknown>,
      ) => Promise<typeof promotions>
    }
    promotions = await promotionModule.listPromotions(
      { is_automatic: true, status: ["active"] },
      { take: 50, relations: ["application_method", "rules", "rules.values", "campaign"] },
    )
  } catch {
    promotions = []
  }

  let freeShipping: StorefrontIncentivesDTO["freeShipping"] = null
  let bundle: StorefrontIncentivesDTO["bundle"] = null
  let timedOffer: StorefrontIncentivesDTO["timedOffer"] = null
  const nowMs = Date.now()
  const preferredTimedOfferPromotionId =
    typeof storeIncentiveMetadata.timedOfferPromotionId === "string"
      ? storeIncentiveMetadata.timedOfferPromotionId
      : null
  const timedOfferCandidates = preferredTimedOfferPromotionId
    ? [
        ...promotions.filter((promotion) => promotion.id === preferredTimedOfferPromotionId),
        ...promotions.filter((promotion) => promotion.id !== preferredTimedOfferPromotionId),
      ]
    : promotions

  for (const promotion of timedOfferCandidates) {
    timedOffer = timedOfferFromPromotion(promotion, storeIncentiveMetadata, nowMs)
    if (timedOffer) break
  }

  for (const promotion of promotions) {
    const code = (promotion.code ?? "").toUpperCase()
    const meta = promotion.metadata ?? undefined
    if (
      !freeShipping &&
      promotion.type === "standard" &&
      promotion.application_method?.target_type === "shipping_methods" &&
      code.startsWith(FREE_SHIPPING_CODE_PREFIX)
    ) {
      const threshold = readFreeShippingThresholdEgp(promotion)
      if (threshold !== null) {
        const label =
          localizedFromMetadata(meta, "label") ??
          localizedFromMetadata(storeIncentiveMetadata, "freeShippingLabel") ??
          { en: `Free shipping over ${threshold} EGP`, ar: `شحن مجاني عند الطلب فوق ${threshold} ج.م` }
        freeShipping = {
          promotionId: promotion.id,
          thresholdEgp: threshold,
          currency: (promotion.application_method.currency_code ?? "egp").toLowerCase(),
          label,
        }
      }
    }

    if (
      !bundle &&
      promotion.type === "buyget" &&
      promotion.application_method?.buy_rules_min_quantity != null &&
      promotion.application_method.apply_to_quantity != null &&
      code.startsWith(BUNDLE_CODE_PREFIX)
    ) {
      const requireQuantity = Math.max(1, Math.trunc(promotion.application_method.buy_rules_min_quantity))
      const applyToQuantity = Math.max(1, Math.trunc(promotion.application_method.apply_to_quantity))
      const applicationValue = asNumber(promotion.application_method.value) ?? 0
      const applicationKind = promotion.application_method.type === "percentage" ? "percentage" : "fixed"
      const label =
        localizedFromMetadata(meta, "label") ??
        localizedFromMetadata(storeIncentiveMetadata, "bundleLabel") ??
        (applicationKind === "fixed"
          ? {
              en: `Buy ${requireQuantity} — save ${applicationValue} EGP`,
              ar: `اشتري ${requireQuantity} ووفر ${applicationValue} ج.م`,
            }
          : {
              en: `Buy ${requireQuantity} — get ${applicationValue}% off`,
              ar: `اشتري ${requireQuantity} واحصل على خصم ${applicationValue}%`,
            })
      bundle = {
        promotionId: promotion.id,
        type: "buyget",
        requireQuantity,
        applyToQuantity,
        applicationValue,
        applicationKind,
        label,
      }
    }
  }

  // Fallback to store metadata when no active free-shipping promotion exists.
  if (!freeShipping) {
    const storeThreshold = await findStoreFreeShippingThresholdEgp(scope)
    if (storeThreshold !== null && storeThreshold > 0) {
      freeShipping = {
        promotionId: "store-settings",
        thresholdEgp: storeThreshold,
        currency: "egp",
        label:
          localizedFromMetadata(storeIncentiveMetadata, "freeShippingLabel") ??
          { en: `Free shipping over ${storeThreshold} EGP`, ar: `شحن مجاني عند الطلب فوق ${storeThreshold} ج.م` },
      }
    }
  }

  const giftWrap = await findGiftWrapDetails(scope)

  return {
    ...EMPTY_INCENTIVES,
    freeShipping,
    bundle,
    timedOffer,
    ...giftWrap,
  }
}
