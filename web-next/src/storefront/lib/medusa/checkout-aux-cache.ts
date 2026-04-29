import { getCart, listPaymentProviders, listShippingOptions } from "./client"
import type { MedusaPaymentProvider, MedusaShippingOption } from "./types"

export const CHECKOUT_AUX_CACHE_MAX_AGE_MS = 45_000

export function normalizePaymentProviders(providers: MedusaPaymentProvider[]) {
  return providers.filter((provider) => typeof provider.id === "string" && provider.id.trim().length > 0)
}

type Timestamped<T> = { at: number; value: T }

const shippingByCartId = new Map<string, Timestamped<MedusaShippingOption[]>>()
const providersByRegionId = new Map<string, Timestamped<MedusaPaymentProvider[]>>()
/** Lets the prefetcher skip a `getCart` round-trip when both ancillary caches are still fresh. */
const regionIdByCartId = new Map<string, Timestamped<string>>()

function isFresh(entry: Timestamped<unknown> | undefined, maxAgeMs: number): boolean {
  if (!entry) return false
  return Date.now() - entry.at <= maxAgeMs
}

export function getCachedRegionIdForCart(
  cartId: string,
  maxAgeMs: number = CHECKOUT_AUX_CACHE_MAX_AGE_MS,
): string | null {
  const entry = regionIdByCartId.get(cartId)
  if (!isFresh(entry, maxAgeMs)) return null
  return entry!.value
}

export function setCachedRegionIdForCart(cartId: string, regionId: string | null | undefined): void {
  if (typeof regionId === "string" && regionId.trim().length > 0) {
    regionIdByCartId.set(cartId, { at: Date.now(), value: regionId })
  }
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
  regionIdByCartId.delete(cartId)
}

/**
 * Fire-and-forget: warms shipping options + payment providers for checkout (mini-cart open).
 *
 * Skips `getCart` entirely when we already know the cart's `region_id` from a recent
 * checkout interaction and both ancillary caches are still fresh — the common case when
 * the user opens the mini-cart twice in quick succession.
 */
export function prefetchCheckoutAuxForCart(cartId: string): void {
  const cachedRegionId = getCachedRegionIdForCart(cartId)
  if (cachedRegionId) {
    const shippingFresh = getFreshShippingOptions(cartId)
    const providersFresh = getFreshPaymentProviders(cachedRegionId)
    if (shippingFresh && providersFresh) return
  }

  void (async () => {
    try {
      const regionId = cachedRegionId ?? (await getCart(cartId)).cart.region_id
      if (!regionId) return
      setCachedRegionIdForCart(cartId, regionId)
      const [shippingOptions, rawProviders] = await Promise.all([
        listShippingOptions(cartId).then((r) => r.shipping_options).catch(() => []),
        listPaymentProviders(regionId).then((r) => r.payment_providers).catch(() => []),
      ])
      setShippingOptionsCache(cartId, shippingOptions)
      setPaymentProvidersCache(regionId, rawProviders)
    } catch {
      /* ignore */
    }
  })()
}
