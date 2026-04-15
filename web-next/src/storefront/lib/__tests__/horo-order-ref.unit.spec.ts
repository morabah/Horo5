import { buildHoroCustomerOrderRef } from "../horo-order-ref"

describe("buildHoroCustomerOrderRef", () => {
  it("formats positive numeric display_id", () => {
    expect(buildHoroCustomerOrderRef({ id: "order_abc", display_id: 42 })).toBe("HORO-42")
  })

  it("floors non-integer display_id", () => {
    expect(buildHoroCustomerOrderRef({ id: "order_abc", display_id: 9.7 })).toBe("HORO-9")
  })

  it("parses positive string display_id", () => {
    expect(buildHoroCustomerOrderRef({ id: "order_abc", display_id: "  18  " })).toBe("HORO-18")
  })

  it("rejects zero or negative display_id and falls back to id", () => {
    expect(buildHoroCustomerOrderRef({ id: "order_fallback", display_id: 0 })).toBe("order_fallback")
    expect(buildHoroCustomerOrderRef({ id: "order_fallback", display_id: -3 })).toBe("order_fallback")
    expect(buildHoroCustomerOrderRef({ id: "order_fallback", display_id: "0" })).toBe("order_fallback")
  })

  it("falls back to id when display_id missing or invalid", () => {
    expect(buildHoroCustomerOrderRef({ id: "order_only" })).toBe("order_only")
    expect(buildHoroCustomerOrderRef({ id: "order_only", display_id: "nope" })).toBe("order_only")
    expect(buildHoroCustomerOrderRef({ id: "order_only", display_id: {} })).toBe("order_only")
  })
})
