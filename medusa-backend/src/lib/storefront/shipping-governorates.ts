export const SHIPPING_GOVERNORATES = [
  { code: "cairo", label_en: "Cairo", label_ar: "القاهرة", price_egp: 70 },
  { code: "giza", label_en: "Giza", label_ar: "الجيزة", price_egp: 70 },
  { code: "alexandria", label_en: "Alexandria", label_ar: "الإسكندرية", price_egp: 90 },
  { code: "other", label_en: "Other governorates", label_ar: "محافظات أخرى", price_egp: 120 },
] as const

export type ShippingGovernorateCode = (typeof SHIPPING_GOVERNORATES)[number]["code"]

export function getShippingGovernorate(code: string) {
  const normalized = code.trim().toLowerCase()
  return SHIPPING_GOVERNORATES.find((row) => row.code === normalized) ?? null
}

export function shippingEgpForGovernorate(code: string): number {
  return getShippingGovernorate(code)?.price_egp ?? SHIPPING_GOVERNORATES.find((row) => row.code === "other")!.price_egp
}

export function readCartDeliveryGovernorate(metadata: Record<string, unknown> | null | undefined): string | null {
  if (!metadata || typeof metadata !== "object") return null
  const raw = metadata.deliveryGovernorate
  if (typeof raw !== "string") return null
  const trimmed = raw.trim().toLowerCase()
  return trimmed.length > 0 ? trimmed : null
}

export function assertCartHasDeliveryGovernorate(metadata: Record<string, unknown> | null | undefined): void {
  const code = readCartDeliveryGovernorate(metadata)
  if (!code || !getShippingGovernorate(code)) {
    const error = new Error("Please choose your governorate before checkout.")
    ;(error as Error & { statusCode?: number }).statusCode = 400
    throw error
  }
}
