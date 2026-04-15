import {
  CHECKOUT_AUX_CACHE_MAX_AGE_MS,
  getFreshPaymentProviders,
  getFreshShippingOptions,
  invalidateCheckoutAuxCacheForCart,
  normalizePaymentProviders,
  setPaymentProvidersCache,
  setShippingOptionsCache,
} from "../checkout-aux-cache"
import type { MedusaPaymentProvider, MedusaShippingOption } from "../types"

describe("normalizePaymentProviders", () => {
  it("keeps providers with non-empty string ids", () => {
    const providers: MedusaPaymentProvider[] = [
      { id: "pp_system_default" },
      { id: "" },
      { id: "   " },
    ]
    expect(normalizePaymentProviders(providers)).toEqual([{ id: "pp_system_default" }])
  })
})

describe("shipping + payment cache freshness", () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date("2026-04-15T12:00:00.000Z"))
  })

  afterEach(() => {
    jest.useRealTimers()
    invalidateCheckoutAuxCacheForCart("cart_a")
  })

  it("returns cached shipping options within max age", () => {
    const opts: MedusaShippingOption[] = [
      { id: "so1", name: "Std", provider_id: "p", amount: 60 },
    ]
    setShippingOptionsCache("cart_a", opts)
    expect(getFreshShippingOptions("cart_a")).toEqual(opts)
  })

  it("returns null when cache is stale", () => {
    const opts: MedusaShippingOption[] = [
      { id: "so1", name: "Std", provider_id: "p", amount: 60 },
    ]
    setShippingOptionsCache("cart_a", opts)
    jest.advanceTimersByTime(CHECKOUT_AUX_CACHE_MAX_AGE_MS + 1)
    expect(getFreshShippingOptions("cart_a")).toBeNull()
  })

  it("returns fresh payment providers by region id", () => {
    const providers: MedusaPaymentProvider[] = [{ id: "cod" }]
    setPaymentProvidersCache("reg_eg", providers)
    expect(getFreshPaymentProviders("reg_eg")).toEqual(providers)
    jest.advanceTimersByTime(CHECKOUT_AUX_CACHE_MAX_AGE_MS + 1)
    expect(getFreshPaymentProviders("reg_eg")).toBeNull()
  })
})
