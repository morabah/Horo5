import { cartLineKey } from "../types"

describe("cartLineKey", () => {
  it("joins slug and size", () => {
    expect(cartLineKey({ productSlug: "signal-line", size: "M" })).toBe("signal-line::M")
  })
})
