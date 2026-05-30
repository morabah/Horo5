import { estimateShippingEgpForGovernorate } from "../shipping-estimate"

describe("estimateShippingEgpForGovernorate", () => {
  it("returns tier for cairo", () => {
    expect(estimateShippingEgpForGovernorate("cairo", { shippingByGovernorate: { cairo: 55 } })).toBe(55)
  })

  it("falls back to default tier", () => {
    expect(estimateShippingEgpForGovernorate("unknown", null)).toBe(100)
  })

  it("uses giza same as cairo tier when configured", () => {
    expect(
      estimateShippingEgpForGovernorate("giza", { shippingByGovernorate: { cairo: 60, giza: 60 } }),
    ).toBe(60)
  })
})
