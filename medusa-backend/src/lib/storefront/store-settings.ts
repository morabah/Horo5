import { Modules } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/types"

import { asNumber, asString, asStringArrayOrEmpty } from "../shared/type-guards"
import { HOMEPAGE_SECTION_TYPES } from "../homepage-sections/types"

/**
 * Admin often stores metadata values as JSON strings — normalize to a plain object for the storefront.
 */
export function parseDeliveryObject(raw: unknown): Record<string, unknown> | null {
  if (raw == null) {
    return null
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>
      }
      return null
    } catch {
      return null
    }
  }
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>
  }
  return null
}

/** Named presets: `{ regular: { measurements, fitModels }, ... }` — may be stringified in Admin. */
export function parseSizeTablesObject(raw: unknown): Record<string, unknown> | null {
  if (raw == null) {
    return null
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>
      }
      return null
    } catch {
      return null
    }
  }
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>
  }
  return null
}

/** Generic blob parser for nested `store.metadata.*` JSON objects (handles stringified Admin values). */
function parseObjectBlob(raw: unknown): Record<string, unknown> | null {
  if (raw == null) return null
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>
      }
      return null
    } catch {
      return null
    }
  }
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>
  }
  return null
}

/** Localized text — both EN and AR fields fall back to a string-only form. */
export type LocalizedText = { en?: string; ar?: string } | string

/** Primary / drawer navigation item. Storefront falls back to hardcoded labels when omitted. */
export type StorefrontNavItemDTO = {
  key: string
  label: LocalizedText
  href: string
  badge?: LocalizedText
  active: boolean
  sortOrder: number
}

export type StorefrontNavigationDTO = {
  primary: StorefrontNavItemDTO[]
  drawer: StorefrontNavItemDTO[]
}

/** One Egypt governorate with payment/shipping eligibility used by checkout. */
export type StorefrontGovernorateDTO = {
  /** Stable code, e.g. `cairo`, `giza`, `alexandria`. */
  code: string
  /** Display name. EN/AR. */
  name: LocalizedText
  /** Whether COD can be selected by default for this governorate. */
  codEligible: boolean
  /** Whether express shipping is offered for this governorate. */
  expressEligible: boolean
}

export type StorefrontCheckoutDTO = {
  governorates: StorefrontGovernorateDTO[]
  /** Stable order in which Medusa payment-provider IDs should appear. Unknown providers append. */
  paymentMethodOrder: string[]
}

/** Price band used by the PLP `Price` filter. */
export type StorefrontPriceBandDTO = {
  /** Stable id (`under-700`, `700-999`, `1000+`). */
  key: string
  /** Inclusive minimum in EGP, or null for "no minimum". */
  minEgp: number | null
  /** Inclusive maximum in EGP, or null for "no maximum". */
  maxEgp: number | null
  label: LocalizedText
}

export type StorefrontSearchSettingsDTO = {
  priceBands: StorefrontPriceBandDTO[]
}

/** Legacy lightweight homepage layout knobs; full CMS-style sections live in the homepage_section module. */
export type StorefrontHomepageSettingsDTO = {
  /**
   * Ordered list of section keys to render on the home page. Storefront falls back to its
   * built-in 5-section list when this is null, ensuring forward compatibility.
   * Allowed keys: hero, trust_ribbon, primary_routes, founding_drop, featured_piece,
   * behind_the_piece, feeling_grid, occasion_grid, why_horo, gift_block, first_drop_circle,
   * proof_strip, artist_spotlight, seen_on_you.
   */
  sectionsEnabled: string[] | null
}

export type StorefrontLoyaltySettingsDTO = {
  creditOnSecondOrderEgp: number | null
  expiryDays: number | null
}

export type StorefrontSettingsDTO = {
  delivery: Record<string, unknown> | null
  sizeTables: Record<string, unknown> | null
  defaultSizeTableKey: string | null
  navigation: StorefrontNavigationDTO | null
  checkout: StorefrontCheckoutDTO | null
  search: StorefrontSearchSettingsDTO | null
  homepage: StorefrontHomepageSettingsDTO | null
  loyalty: StorefrontLoyaltySettingsDTO | null
  /** Trust-badge fallback list when a product has no explicit `metadata.trustBadges`. */
  defaultTrustBadges: string[] | null
  /** Free-shipping threshold in EGP used by incentives/seed scripts. */
  freeShippingThresholdEgp: number | null
  /** Default per-variant stock quantity used by inventory backfill scripts. */
  defaultStockQty: number | null
}

function asLocalizedText(value: unknown): LocalizedText | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed ? trimmed : undefined
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const en = asString((value as Record<string, unknown>).en)
    const ar = asString((value as Record<string, unknown>).ar)
    if (!en && !ar) return undefined
    return { ...(en ? { en } : {}), ...(ar ? { ar } : {}) }
  }
  return undefined
}

function parseNavItem(raw: unknown, fallbackSortOrder: number): StorefrontNavItemDTO | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null
  const r = raw as Record<string, unknown>
  const key = asString(r.key)
  const href = asString(r.href)
  const label = asLocalizedText(r.label)
  if (!key || !href || !label) return null
  const sortOrderRaw = typeof r.sortOrder === "number" ? r.sortOrder : Number(r.sortOrder ?? NaN)
  const sortOrder = Number.isFinite(sortOrderRaw) ? sortOrderRaw : fallbackSortOrder
  const active = r.active === false ? false : true
  const badge = asLocalizedText(r.badge)
  return {
    key,
    label,
    href,
    ...(badge ? { badge } : {}),
    active,
    sortOrder,
  }
}

function parseNavigation(raw: unknown): StorefrontNavigationDTO | null {
  const obj = parseObjectBlob(raw)
  if (!obj) return null
  const primaryRaw = Array.isArray(obj.primary) ? obj.primary : []
  const drawerRaw = Array.isArray(obj.drawer) ? obj.drawer : []
  const primary = primaryRaw
    .map((item, idx) => parseNavItem(item, idx))
    .filter((item): item is StorefrontNavItemDTO => item !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder)
  const drawer = drawerRaw
    .map((item, idx) => parseNavItem(item, idx))
    .filter((item): item is StorefrontNavItemDTO => item !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder)
  if (primary.length === 0 && drawer.length === 0) return null
  return { primary, drawer }
}

function parseGovernorate(raw: unknown): StorefrontGovernorateDTO | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null
  const r = raw as Record<string, unknown>
  const code = asString(r.code)
  const name = asLocalizedText(r.name)
  if (!code || !name) return null
  return {
    code,
    name,
    codEligible: r.codEligible === false ? false : true,
    expressEligible: r.expressEligible === false ? false : true,
  }
}

function parseCheckout(raw: unknown): StorefrontCheckoutDTO | null {
  const obj = parseObjectBlob(raw)
  if (!obj) return null
  const governorates = Array.isArray(obj.governorates)
    ? obj.governorates
        .map(parseGovernorate)
        .filter((row): row is StorefrontGovernorateDTO => row !== null)
    : []
  const paymentMethodOrder = Array.isArray(obj.paymentMethodOrder)
    ? obj.paymentMethodOrder.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
    : []
  if (governorates.length === 0 && paymentMethodOrder.length === 0) return null
  return { governorates, paymentMethodOrder }
}

function parsePriceBand(raw: unknown): StorefrontPriceBandDTO | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null
  const r = raw as Record<string, unknown>
  const key = asString(r.key)
  const label = asLocalizedText(r.label)
  if (!key || !label) return null
  const minRaw = r.minEgp
  const maxRaw = r.maxEgp
  const minEgp =
    minRaw === null || minRaw === undefined ? null : Number.isFinite(Number(minRaw)) ? Math.max(0, Math.trunc(Number(minRaw))) : null
  const maxEgp =
    maxRaw === null || maxRaw === undefined ? null : Number.isFinite(Number(maxRaw)) ? Math.max(0, Math.trunc(Number(maxRaw))) : null
  return { key, minEgp, maxEgp, label }
}

function parseSearch(raw: unknown): StorefrontSearchSettingsDTO | null {
  const obj = parseObjectBlob(raw)
  if (!obj) return null
  const bandsRaw = Array.isArray(obj.priceBands) ? obj.priceBands : []
  const priceBands = bandsRaw
    .map(parsePriceBand)
    .filter((band): band is StorefrontPriceBandDTO => band !== null)
  if (priceBands.length === 0) return null
  return { priceBands }
}

/** Recognized homepage section keys — kept in sync with storefront component map. */
const HOMEPAGE_SECTION_KEYS = new Set<string>([...HOMEPAGE_SECTION_TYPES, "behind_the_piece"])

function parseHomepage(raw: unknown): StorefrontHomepageSettingsDTO | null {
  const obj = parseObjectBlob(raw)
  if (!obj) return null
  const enabledRaw = Array.isArray(obj.sectionsEnabled) ? obj.sectionsEnabled : null
  if (!enabledRaw) return null
  const sectionsEnabled = enabledRaw
    .filter((key): key is string => typeof key === "string" && HOMEPAGE_SECTION_KEYS.has(key))
  if (sectionsEnabled.length === 0) return null
  return { sectionsEnabled }
}

function asNonNegativeInt(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null
  const num = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(num) || num < 0) return null
  return Math.trunc(num)
}

function parseLoyalty(raw: unknown): StorefrontLoyaltySettingsDTO | null {
  const obj = parseObjectBlob(raw)
  if (!obj) return null
  const creditOnSecondOrderEgp = asNonNegativeInt(obj.creditOnSecondOrderEgp)
  const expiryDays = asNonNegativeInt(obj.expiryDays)
  if (creditOnSecondOrderEgp == null && expiryDays == null) return null
  return { creditOnSecondOrderEgp, expiryDays }
}

/**
 * Public storefront settings subset (no secrets).
 * Operators set `store.metadata.delivery`, `store.metadata.sizeTables`, `store.metadata.defaultSizeTableKey`,
 * and (optionally) `store.metadata.navigation`, `store.metadata.checkout`, `store.metadata.search`.
 */
export async function retrieveStorefrontSettingsPayload(scope: MedusaContainer): Promise<StorefrontSettingsDTO> {
  const storeModule = scope.resolve(Modules.STORE)
  const stores = await storeModule.listStores()
  const store = stores[0] as { metadata?: Record<string, unknown> | null } | undefined
  const meta = store?.metadata ?? {}
  const delivery = parseDeliveryObject(meta.delivery)
  const sizeTables = parseSizeTablesObject(meta.sizeTables)
  const defaultSizeTableKey =
    typeof meta.defaultSizeTableKey === "string" && meta.defaultSizeTableKey.trim()
      ? meta.defaultSizeTableKey.trim()
      : null
  const navigation = parseNavigation(meta.navigation)
  const checkout = parseCheckout(meta.checkout)
  const search = parseSearch(meta.search)
  const homepage = parseHomepage(meta.homepage)
  const loyalty = parseLoyalty(meta.loyalty)

  /** Store-level override for default product trust badges. */
  const defaultTrustBadges = asStringArrayOrEmpty(meta.defaultTrustBadges)

  /** Store-level override for free-shipping threshold. */
  const freeShippingThresholdEgp =
    typeof meta.freeShippingThresholdEgp === "number"
      ? meta.freeShippingThresholdEgp
      : typeof meta.freeShippingThresholdEgp === "string"
        ? Number(meta.freeShippingThresholdEgp)
        : null

  /** Store-level override for default per-variant stock quantity. */
  const defaultStockQty =
    typeof meta.defaultStockQty === "number"
      ? meta.defaultStockQty
      : typeof meta.defaultStockQty === "string"
        ? Number(meta.defaultStockQty)
        : null

  return {
    delivery,
    sizeTables,
    defaultSizeTableKey,
    navigation,
    checkout,
    search,
    homepage,
    loyalty,
    defaultTrustBadges: defaultTrustBadges.length > 0 ? defaultTrustBadges : null,
    freeShippingThresholdEgp:
      freeShippingThresholdEgp !== null && Number.isFinite(freeShippingThresholdEgp) && freeShippingThresholdEgp >= 0
        ? Math.round(freeShippingThresholdEgp)
        : null,
    defaultStockQty:
      defaultStockQty !== null && Number.isFinite(defaultStockQty) && defaultStockQty >= 0 && Number.isInteger(defaultStockQty)
        ? defaultStockQty
        : null,
  }
}
