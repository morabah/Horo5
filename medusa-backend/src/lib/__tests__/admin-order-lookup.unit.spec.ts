import { parseAdminOrderLookupQuery } from "../admin-order-lookup"

describe("parseAdminOrderLookupQuery", () => {
  it("parses internal order id", () => {
    expect(parseAdminOrderLookupQuery("order_01KP82WSNKG5N7KFFFVJXMAE09")).toEqual({
      kind: "id",
      id: "order_01KP82WSNKG5N7KFFFVJXMAE09",
    })
  })

  it("parses HORO- prefix", () => {
    expect(parseAdminOrderLookupQuery("HORO-18")).toEqual({ kind: "display_id", value: 18 })
    expect(parseAdminOrderLookupQuery("horo-3")).toEqual({ kind: "display_id", value: 3 })
  })

  it("parses plain display number", () => {
    expect(parseAdminOrderLookupQuery("18")).toEqual({ kind: "display_id", value: 18 })
    expect(parseAdminOrderLookupQuery("#42")).toEqual({ kind: "display_id", value: 42 })
  })

  it("rejects empty and junk", () => {
    expect(parseAdminOrderLookupQuery("").kind).toBe("invalid")
    expect(parseAdminOrderLookupQuery("  ").kind).toBe("invalid")
    expect(parseAdminOrderLookupQuery("HORO-").kind).toBe("invalid")
    expect(parseAdminOrderLookupQuery("not-an-order").kind).toBe("invalid")
  })
})
