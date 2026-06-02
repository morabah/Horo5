import {
  assertCartHasDeliveryGovernorate,
  getShippingGovernorate,
  readCartDeliveryGovernorate,
  shippingEgpForGovernorate,
} from "../shipping-governorates"

describe("shipping-governorates", () => {
  it("returns cairo shipping rate", () => {
    expect(shippingEgpForGovernorate("cairo")).toBe(70)
    expect(getShippingGovernorate("cairo")?.label_en).toBe("Cairo")
  })

  it("reads delivery governorate from cart metadata", () => {
    expect(readCartDeliveryGovernorate({ deliveryGovernorate: "giza" })).toBe("giza")
    expect(readCartDeliveryGovernorate({})).toBeNull()
  })

  it("assertCartHasDeliveryGovernorate throws when missing", () => {
    expect(() => assertCartHasDeliveryGovernorate(null)).toThrow(/governorate/i)
  })
})
