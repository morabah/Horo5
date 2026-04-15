import { cartLineKey } from "../types"

describe("cartLineKey", () => {
  it("joins slug and size", () => {
    expect(cartLineKey({ productSlug: "signal-line", size: "M" })).toBe("signal-line::M")
  })

  it("includes variant id when set (multi-color)", () => {
    expect(cartLineKey({ productSlug: "signal-line", size: "M", variantId: "var_01" })).toBe(
      "signal-line::M::var_01",
    )
  })
})
