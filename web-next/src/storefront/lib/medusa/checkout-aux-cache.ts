import { getCart, listPaymentProviders, listShippingOptions } from "./client"
import type { MedusaPaymentProvider, MedusaShippingOption } from "./types"

export const CHECKOUT_AUX_CACHE_MAX_AGE_MS = 45_000

export function normalizePaymentProviders(providers: MedusaPaymentProvider[]) {
  return providers.filter((provider) => typeof provider.id === "string" && provider.id.trim().length > 0)
}

type Timestamped<T> = { at: number; value: T }

const shippingByCartId = new Map<string, Timestamped<MedusaShippingOption[]>>()
const providersByRegionId = new Map<string, Timestamped<MedusaPaymentProvider[]>>()

function isFresh(entry: Timestamped<unknown> | undefined, maxAgeMs: number): boolean {
  if (!entry) return false
  return Date.now() - entry.at <= maxAgeMs
}

export function getFreshShippingOptions(
  cartId: string,
  maxAgeMs: number = CHECKOUT_AUX_CACHE_MAX_AGE_MS,
): MedusaShippingOption[] | null {
  const entry = shippingByCartId.get(cartId)
  if (!isFresh(entry, maxAgeMs)) return null
  return entry!.value
}

export function setShippingOptionsCache(cartId: string, options: MedusaShippingOption[]) {
  shippingByCartId.set(cartId, { at: Date.now(), value: options })
}

export function getFreshPaymentProviders(
  regionId: string,
  maxAgeMs: number = CHECKOUT_AUX_CACHE_MAX_AGE_MS,
): MedusaPaymentProvider[] | null {
  const entry = providersByRegionId.get(regionId)
  if (!isFresh(entry, maxAgeMs)) return null
  return normalizePaymentProviders(entry!.value)
}

export function setPaymentProvidersCache(regionId: string, providers: MedusaPaymentProvider[]) {
  providersByRegionId.set(regionId, { at: Date.now(), value: normalizePaymentProviders(providers) })
}

export function invalidateCheckoutAuxCacheForCart(cartId: string) {
  shippingByCartId.delete(cartId)
}

/** Fire-and-forget: warms shipping options + payment providers for checkout (mini-cart open). */
export function prefetchCheckoutAuxForCart(cartId: string): void {
  void (async () => {
    try {
      const { cart } = await getCart(cartId)
      if (!cart.region_id) return
      const [shippingOptions, rawProviders] = await Promise.all([
        listShippingOptions(cartId).then((r) => r.shipping_options).catch(() => []),
        listPaymentProviders(cart.region_id).then((r) => r.payment_providers).catch(() => []),
      ])
      setShippingOptionsCache(cartId, shippingOptions)
      setPaymentProvidersCache(cart.region_id, rawProviders)
    } catch {
      /* ignore */
    }
  })()
}
