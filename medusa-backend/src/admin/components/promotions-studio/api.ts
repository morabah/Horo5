import { sdk } from "../../lib/sdk"

export type PromoLabelValue = string | { en?: string; ar?: string }

export type AdminPrice = {
  amount?: number | null
  currency_code?: string | null
}

export type AdminVariant = {
  id: string
  title?: string
  prices?: AdminPrice[] | null
}

export type AdminProduct = {
  id: string
  title: string
  handle: string
  status: string
  thumbnail?: string | null
  metadata?: Record<string, unknown> | null
  variants?: AdminVariant[] | null
}

type ProductListResponse = {
  products: AdminProduct[]
  count: number
  limit: number
  offset: number
}

export const PAGE_SIZE = 200

export async function fetchProducts(q?: string): Promise<AdminProduct[]> {
  const params: Record<string, string> = {
    limit: String(PAGE_SIZE),
    offset: "0",
    fields: "id,title,handle,status,thumbnail,metadata,variants.id,variants.title,variants.prices.amount,variants.prices.currency_code",
  }
  if (q?.trim()) params.q = q.trim()
  const data = await sdk.client.fetch<ProductListResponse>("/admin/products?" + new URLSearchParams(params).toString(), { method: "GET" })
  return data.products ?? []
}

export async function patchProductMetadata(id: string, patch: Record<string, unknown>) {
  await sdk.admin.product.update(id, { metadata: patch })
}

export function normalizePromoLabel(value: unknown): { en: string; ar: string } {
  if (typeof value === "string") {
    const trimmed = value.trim()
    return { en: trimmed, ar: trimmed }
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const raw = value as Record<string, unknown>
    return {
      en: typeof raw.en === "string" ? raw.en.trim() : "",
      ar: typeof raw.ar === "string" ? raw.ar.trim() : "",
    }
  }
  return { en: "", ar: "" }
}

export function promoLabelForMetadata(label: { en: string; ar: string }): PromoLabelValue | null {
  const en = label.en.trim()
  const ar = label.ar.trim()
  if (!en && !ar) return null
  return {
    ...(en ? { en } : {}),
    ...(ar ? { ar } : {}),
  }
}

export function getPromoLabel(product: AdminProduct): { en: string; ar: string } {
  return normalizePromoLabel(product.metadata?.promoLabel)
}

export function getPromoLabelDisplay(product: AdminProduct): string {
  const label = getPromoLabel(product)
  return label.en || label.ar
}

export function formatDateTimeLocal(value: unknown): string {
  if (typeof value !== "string" || !value) return ""
  const ms = Date.parse(value)
  if (!Number.isFinite(ms)) return ""
  return new Date(ms).toISOString().slice(0, 16)
}

export function toIsoOrNull(value: string): string | null {
  if (!value.trim()) return null
  const ms = Date.parse(value)
  if (!Number.isFinite(ms)) return null
  return new Date(ms).toISOString()
}

export function getPromoStartsAt(product: AdminProduct): string {
  return formatDateTimeLocal(product.metadata?.promo_starts_at)
}

export function getPromoEndsAt(product: AdminProduct): string {
  return formatDateTimeLocal(product.metadata?.promo_ends_at)
}

export function getPromoShowCountdown(product: AdminProduct): boolean {
  return product.metadata?.promoShowCountdown !== false
}

export type PromoStatus = "scheduled" | "active" | "expired"

export function getPromoStatus(product: AdminProduct): PromoStatus | null {
  if (!getPromoLabelDisplay(product)) return null
  const now = Date.now()
  const startsAt = product.metadata?.promo_starts_at
  const endsAt = product.metadata?.promo_ends_at
  const startsMs = startsAt ? Date.parse(String(startsAt)) : NaN
  const endsMs = endsAt ? Date.parse(String(endsAt)) : NaN
  if (Number.isFinite(startsMs) && startsMs > now) return "scheduled"
  if (Number.isFinite(endsMs) && endsMs <= now) return "expired"
  return "active"
}

export function getPromoStatusText(product: AdminProduct): string {
  const status = getPromoStatus(product)
  if (!status) return ""
  if (status === "scheduled") return "Scheduled"
  if (status === "expired") return "Expired"

  const endsAt = product.metadata?.promo_ends_at
  if (!endsAt) return "Active"
  const ms = Date.parse(String(endsAt))
  if (!Number.isFinite(ms)) return "Active"
  const diff = ms - Date.now()
  if (diff <= 0) return "Expired"
  const hours = Math.floor(diff / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  if (hours > 48) return `Active - ${Math.floor(hours / 24)}d left`
  if (hours > 0) return `Active - ${hours}h ${minutes}m left`
  return `Active - ${minutes}m left`
}

export function getPromoPriceListId(product: AdminProduct): string | null {
  const raw = product.metadata?.promoPriceListId
  return typeof raw === "string" && raw ? raw : null
}

export function isPromoActive(product: AdminProduct): boolean {
  return getPromoStatus(product) === "active"
}

export function computeVariantPrices(
  product: AdminProduct,
  discountType: "flat" | "percent",
  discountValue: number
): Array<{ variant_id: string; amount: number; currency_code: string }> {
  const prices: Array<{ variant_id: string; amount: number; currency_code: string }> = []
  for (const variant of product.variants ?? []) {
    const egp = variant.prices?.find((p) => (p.currency_code || "").toLowerCase() === "egp")
    if (!egp || typeof egp.amount !== "number") continue
    const base = egp.amount
    const sale = discountType === "flat"
      ? base - discountValue
      : Math.round(base * (1 - discountValue / 100))
    if (!Number.isFinite(sale) || sale <= 0 || sale >= base) continue
    prices.push({ variant_id: variant.id, amount: sale, currency_code: "egp" })
  }
  return prices
}

export function formatPricePreview(
  product: AdminProduct,
  discountType: "flat" | "percent",
  discountValue: number
): string {
  const prices = computeVariantPrices(product, discountType, discountValue)
  if (prices.length === 0) return "No EGP variants"
  const first = prices[0]
  const base = product.variants?.find((v) => v.id === first.variant_id)?.prices?.find(
    (p) => (p.currency_code || "").toLowerCase() === "egp"
  )
  const baseAmount = base?.amount ?? 0
  return `${baseAmount} -> ${first.amount} EGP${prices.length > 1 ? ` (+${prices.length - 1} variants)` : ""}`
}
