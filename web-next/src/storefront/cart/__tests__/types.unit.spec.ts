import {
  cartLineIdentityKey,
  cartLineKey,
  cartLineViewKey,
  findMergeableCartLineIndex,
  removeCartLine,
  updateCartLineQty,
  type CartLine,
} from "../types"

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

describe("cart line identity helpers", () => {
  const lines: CartLine[] = [
    { productSlug: "signal-line", size: "M", qty: 1, lineId: "line_a", variantId: "var_a", unitPriceEgp: 100 },
    { productSlug: "signal-line", size: "M", qty: 2, lineId: "line_b", variantId: "var_b", unitPriceEgp: 120 },
  ]

  it("uses line id for pending and render identities when present", () => {
    expect(cartLineIdentityKey(lines[0])).toBe("line:line_a")
    expect(cartLineViewKey(lines[0])).toBe("signal-line::M::var_a::line_a")
  })

  it("updates only the matching Medusa line when product and size are shared", () => {
    const next = updateCartLineQty(lines, { productSlug: "signal-line", size: "M", lineId: "line_a" }, 3)

    expect(next).toEqual([
      {
        productSlug: "signal-line",
        size: "M",
        qty: 3,
        lineId: "line_a",
        variantId: "var_a",
        unitPriceEgp: 100,
        medusaLineTotalEgp: 300,
      },
      lines[1],
    ])
  })

  it("removes only the matching Medusa line when sibling catalog keys are similar", () => {
    expect(removeCartLine(lines, { productSlug: "signal-line", size: "M", lineId: "line_b" })).toEqual([
      lines[0],
    ])
  })

  it("merges a newly resolved variant into an older local row without duplicating it", () => {
    const legacy: CartLine[] = [{ productSlug: "signal-line", size: "M", qty: 1 }]

    expect(findMergeableCartLineIndex(legacy, { productSlug: "signal-line", size: "M", variantId: "var_a" })).toBe(0)
  })
})
