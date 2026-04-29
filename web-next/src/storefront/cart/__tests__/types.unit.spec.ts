import {
  cartLineIdentityKey,
  cartLineKey,
  cartLineViewKey,
  cartLineWithQty,
  findCartLineIndex,
  findMergeableCartLineIndex,
  orderCartLinesByPreviousOrder,
  removeCartLine,
  updateCartLineQty,
  type CartLine,
} from "../types"

// ---------------------------------------------------------------------------
// cartLineKey
// ---------------------------------------------------------------------------
describe("cartLineKey", () => {
  it("joins slug and size", () => {
    expect(cartLineKey({ productSlug: "signal-line", size: "M" })).toBe("signal-line::M")
  })

  it("includes variant id when set (multi-color)", () => {
    expect(cartLineKey({ productSlug: "signal-line", size: "M", variantId: "var_01" })).toBe(
      "signal-line::M::var_01",
    )
  })

  it("handles different sizes for the same product", () => {
    expect(cartLineKey({ productSlug: "signal-line", size: "S" })).toBe("signal-line::S")
    expect(cartLineKey({ productSlug: "signal-line", size: "XL" })).toBe("signal-line::XL")
  })

  it("handles edge case with empty variant id", () => {
    // An undefined variantId should produce the slug::size form
    expect(cartLineKey({ productSlug: "signal-line", size: "M", variantId: undefined })).toBe("signal-line::M")
  })

  it("produces unique keys for different variants of the same product/size", () => {
    const key1 = cartLineKey({ productSlug: "signal-line", size: "M", variantId: "var_01" })
    const key2 = cartLineKey({ productSlug: "signal-line", size: "M", variantId: "var_02" })
    expect(key1).not.toBe(key2)
  })
})

// ---------------------------------------------------------------------------
// cartLineIdentityKey
// ---------------------------------------------------------------------------
describe("cartLineIdentityKey", () => {
  it("uses Medusa lineId when present", () => {
    expect(cartLineIdentityKey({ productSlug: "signal-line", size: "M", lineId: "line_a" })).toBe("line:line_a")
  })

  it("falls back to catalog key when lineId is absent", () => {
    expect(cartLineIdentityKey({ productSlug: "signal-line", size: "M" })).toBe("catalog:signal-line::M")
  })

  it("falls back to catalog key with variantId when lineId is absent", () => {
    expect(cartLineIdentityKey({ productSlug: "signal-line", size: "M", variantId: "var_01" })).toBe(
      "catalog:signal-line::M::var_01",
    )
  })

  it("prefers lineId over catalog key even when variantId is present", () => {
    expect(
      cartLineIdentityKey({ productSlug: "signal-line", size: "M", variantId: "var_01", lineId: "line_a" }),
    ).toBe("line:line_a")
  })
})

// ---------------------------------------------------------------------------
// cartLineViewKey
// ---------------------------------------------------------------------------
describe("cartLineViewKey", () => {
  it("appends lineId to catalog key when present", () => {
    expect(
      cartLineViewKey({ productSlug: "signal-line", size: "M", variantId: "var_a", lineId: "line_a" }),
    ).toBe("signal-line::M::var_a::line_a")
  })

  it("returns catalog key when lineId is absent", () => {
    expect(cartLineViewKey({ productSlug: "signal-line", size: "M" })).toBe("signal-line::M")
  })
})

// ---------------------------------------------------------------------------
// cartLineWithQty
// ---------------------------------------------------------------------------
describe("cartLineWithQty", () => {
  it("creates a new line with updated qty and medusaLineTotalEgp", () => {
    const line: CartLine = { productSlug: "signal-line", size: "M", qty: 1, unitPriceEgp: 100 }
    const updated = cartLineWithQty(line, 3)
    expect(updated.qty).toBe(3)
    expect(updated.medusaLineTotalEgp).toBe(300)
  })

  it("does not set medusaLineTotalEgp when unitPriceEgp is absent", () => {
    const line: CartLine = { productSlug: "signal-line", size: "M", qty: 1 }
    const updated = cartLineWithQty(line, 5)
    expect(updated.qty).toBe(5)
    expect(updated.medusaLineTotalEgp).toBeUndefined()
  })

  it("preserves all other properties", () => {
    const line: CartLine = {
      productSlug: "signal-line",
      size: "M",
      qty: 1,
      lineId: "line_a",
      variantId: "var_a",
      productName: "Signal Line",
      imageSrc: "/img.jpg",
      unitPriceEgp: 100,
    }
    const updated = cartLineWithQty(line, 2)
    expect(updated.productSlug).toBe("signal-line")
    expect(updated.lineId).toBe("line_a")
    expect(updated.variantId).toBe("var_a")
    expect(updated.productName).toBe("Signal Line")
    expect(updated.imageSrc).toBe("/img.jpg")
  })

  it("does not mutate the original line", () => {
    const line: CartLine = { productSlug: "signal-line", size: "M", qty: 1, unitPriceEgp: 100 }
    const updated = cartLineWithQty(line, 3)
    expect(line.qty).toBe(1)
    expect(updated.qty).toBe(3)
    expect(line).not.toBe(updated)
  })
})

// ---------------------------------------------------------------------------
// findCartLineIndex
// ---------------------------------------------------------------------------
describe("findCartLineIndex", () => {
  const lines: CartLine[] = [
    { productSlug: "signal-line", size: "M", qty: 1, lineId: "line_a", variantId: "var_a", unitPriceEgp: 100 },
    { productSlug: "signal-line", size: "M", qty: 2, lineId: "line_b", variantId: "var_b", unitPriceEgp: 120 },
    { productSlug: "quiet-revolt", size: "L", qty: 1, variantId: "var_c", unitPriceEgp: 150 },
  ]

  it("finds by lineId first (exact match)", () => {
    const idx = findCartLineIndex(lines, { productSlug: "signal-line", size: "M", lineId: "line_b" })
    expect(idx).toBe(1)
  })

  it("falls back to catalog key when lineId is not provided", () => {
    const idx = findCartLineIndex(lines, { productSlug: "quiet-revolt", size: "L", variantId: "var_c" })
    expect(idx).toBe(2)
  })

  it("falls back to catalog key when lineId does not match any line", () => {
    const idx = findCartLineIndex(lines, {
      productSlug: "quiet-revolt",
      size: "L",
      lineId: "nonexistent",
      variantId: "var_c",
    })
    expect(idx).toBe(2)
  })

  it("returns -1 when no match is found", () => {
    const idx = findCartLineIndex(lines, { productSlug: "nonexistent", size: "M" })
    expect(idx).toBe(-1)
  })

  it("distinguishes between two lines with same product/size but different variantIds", () => {
    const idx1 = findCartLineIndex(lines, { productSlug: "signal-line", size: "M", variantId: "var_a" })
    const idx2 = findCartLineIndex(lines, { productSlug: "signal-line", size: "M", variantId: "var_b" })
    expect(idx1).toBe(0)
    expect(idx2).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// findMergeableCartLineIndex
// ---------------------------------------------------------------------------
describe("findMergeableCartLineIndex", () => {
  it("returns exact match index when variantId matches", () => {
    const lines: CartLine[] = [
      { productSlug: "signal-line", size: "M", qty: 1, variantId: "var_a" },
    ]
    expect(findMergeableCartLineIndex(lines, { productSlug: "signal-line", size: "M", variantId: "var_a" })).toBe(0)
  })

  it("merges a newly resolved variant into an older local row without duplicating it", () => {
    const legacy: CartLine[] = [{ productSlug: "signal-line", size: "M", qty: 1 }]
    expect(findMergeableCartLineIndex(legacy, { productSlug: "signal-line", size: "M", variantId: "var_a" })).toBe(0)
  })

  it("does NOT merge when the existing line already has a different variantId", () => {
    const lines: CartLine[] = [
      { productSlug: "signal-line", size: "M", qty: 1, variantId: "var_a" },
    ]
    // New variant var_b should NOT merge into the var_a row
    expect(findMergeableCartLineIndex(lines, { productSlug: "signal-line", size: "M", variantId: "var_b" })).toBe(-1)
  })

  it("returns -1 when nothing matches and no mergeable row exists", () => {
    const lines: CartLine[] = [
      { productSlug: "quiet-revolt", size: "L", qty: 1, variantId: "var_c" },
    ]
    expect(findMergeableCartLineIndex(lines, { productSlug: "signal-line", size: "M", variantId: "var_a" })).toBe(-1)
  })

  it("returns -1 for identity without variantId if no exact match", () => {
    const lines: CartLine[] = [
      { productSlug: "signal-line", size: "M", qty: 1, variantId: "var_a" },
    ]
    // Without a variantId in the search, findMergeableCartLineIndex should only try exact match
    expect(findMergeableCartLineIndex(lines, { productSlug: "signal-line", size: "L" })).toBe(-1)
  })
})

// ---------------------------------------------------------------------------
// orderCartLinesByPreviousOrder
// ---------------------------------------------------------------------------
describe("orderCartLinesByPreviousOrder", () => {
  it("keeps the visible cart row order when Medusa returns changed lines in a different order", () => {
    const previousLines: CartLine[] = [
      { productSlug: "quiet-revolt", size: "S", qty: 2, lineId: "line_quiet", variantId: "var_quiet" },
      { productSlug: "silent-scream", size: "M", qty: 4, lineId: "line_silent", variantId: "var_silent" },
    ]
    const serverLines: CartLine[] = [
      { productSlug: "silent-scream", size: "M", qty: 5, lineId: "line_silent", variantId: "var_silent" },
      { productSlug: "quiet-revolt", size: "S", qty: 3, lineId: "line_quiet", variantId: "var_quiet" },
    ]

    expect(orderCartLinesByPreviousOrder(serverLines, previousLines)).toEqual([
      serverLines[1],
      serverLines[0],
    ])
  })

  it("matches a local optimistic row to the server line once Medusa assigns a line id", () => {
    const previousLines: CartLine[] = [
      { productSlug: "quiet-revolt", size: "S", qty: 1, variantId: "var_quiet" },
      { productSlug: "silent-scream", size: "M", qty: 2, lineId: "line_silent", variantId: "var_silent" },
    ]
    const serverLines: CartLine[] = [
      { productSlug: "silent-scream", size: "M", qty: 2, lineId: "line_silent", variantId: "var_silent" },
      { productSlug: "quiet-revolt", size: "S", qty: 1, lineId: "line_quiet", variantId: "var_quiet" },
    ]

    expect(orderCartLinesByPreviousOrder(serverLines, previousLines)).toEqual([
      serverLines[1],
      serverLines[0],
    ])
  })

  it("appends genuinely new server lines after the known cart rows", () => {
    const previousLines: CartLine[] = [
      { productSlug: "quiet-revolt", size: "S", qty: 1, lineId: "line_quiet", variantId: "var_quiet" },
    ]
    const serverLines: CartLine[] = [
      { productSlug: "silent-scream", size: "M", qty: 1, lineId: "line_silent", variantId: "var_silent" },
      { productSlug: "quiet-revolt", size: "S", qty: 1, lineId: "line_quiet", variantId: "var_quiet" },
    ]

    expect(orderCartLinesByPreviousOrder(serverLines, previousLines)).toEqual([
      serverLines[1],
      serverLines[0],
    ])
  })
})

// ---------------------------------------------------------------------------
// updateCartLineQty
// ---------------------------------------------------------------------------
describe("updateCartLineQty", () => {
  const lines: CartLine[] = [
    { productSlug: "signal-line", size: "M", qty: 1, lineId: "line_a", variantId: "var_a", unitPriceEgp: 100 },
    { productSlug: "signal-line", size: "M", qty: 2, lineId: "line_b", variantId: "var_b", unitPriceEgp: 120 },
    { productSlug: "quiet-revolt", size: "L", qty: 1, variantId: "var_c", unitPriceEgp: 150 },
  ]

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
      lines[2],
    ])
  })

  it("updates the second line without affecting the first", () => {
    const next = updateCartLineQty(lines, { productSlug: "signal-line", size: "M", lineId: "line_b" }, 5)
    expect(next[0]).toBe(lines[0]) // Reference equality — untouched
    expect(next[1].qty).toBe(5)
    expect(next[1].medusaLineTotalEgp).toBe(600)
    expect(next[2]).toBe(lines[2])
  })

  it("removes the line when qty < 1", () => {
    const next = updateCartLineQty(lines, { productSlug: "quiet-revolt", size: "L", variantId: "var_c" }, 0)
    expect(next).toHaveLength(2)
    expect(next.some((l) => l.productSlug === "quiet-revolt")).toBe(false)
  })

  it("returns original array when identity not found", () => {
    const next = updateCartLineQty(lines, { productSlug: "nonexistent", size: "M" }, 5)
    expect(next).toBe(lines)
  })

  it("does not mutate the original array", () => {
    const originalLength = lines.length
    const originalQty = lines[0].qty
    updateCartLineQty(lines, { productSlug: "signal-line", size: "M", lineId: "line_a" }, 99)
    expect(lines).toHaveLength(originalLength)
    expect(lines[0].qty).toBe(originalQty)
  })
})

// ---------------------------------------------------------------------------
// removeCartLine
// ---------------------------------------------------------------------------
describe("removeCartLine", () => {
  const lines: CartLine[] = [
    { productSlug: "signal-line", size: "M", qty: 1, lineId: "line_a", variantId: "var_a", unitPriceEgp: 100 },
    { productSlug: "signal-line", size: "M", qty: 2, lineId: "line_b", variantId: "var_b", unitPriceEgp: 120 },
    { productSlug: "quiet-revolt", size: "L", qty: 1, variantId: "var_c", unitPriceEgp: 150 },
  ]

  it("removes only the matching Medusa line when sibling catalog keys are similar", () => {
    expect(removeCartLine(lines, { productSlug: "signal-line", size: "M", lineId: "line_b" })).toEqual([
      lines[0],
      lines[2],
    ])
  })

  it("removes by catalog key fallback when lineId is not provided", () => {
    const result = removeCartLine(lines, { productSlug: "quiet-revolt", size: "L", variantId: "var_c" })
    expect(result).toHaveLength(2)
    expect(result.some((l) => l.productSlug === "quiet-revolt")).toBe(false)
  })

  it("returns original array when identity not found", () => {
    const result = removeCartLine(lines, { productSlug: "nonexistent", size: "M" })
    expect(result).toBe(lines)
  })

  it("does not mutate the original array", () => {
    const originalLength = lines.length
    removeCartLine(lines, { productSlug: "signal-line", size: "M", lineId: "line_a" })
    expect(lines).toHaveLength(originalLength)
  })

  it("handles removing the last item", () => {
    const singleLine: CartLine[] = [{ productSlug: "signal-line", size: "M", qty: 1 }]
    const result = removeCartLine(singleLine, { productSlug: "signal-line", size: "M" })
    expect(result).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Isolation test: rapid updates to multiple lines
// ---------------------------------------------------------------------------
describe("rapid sequential updates to multiple lines", () => {
  it("correctly updates only the targeted line in each step", () => {
    let state: CartLine[] = [
      { productSlug: "signal-line", size: "M", qty: 1, lineId: "line_a", variantId: "var_a", unitPriceEgp: 100 },
      { productSlug: "quiet-revolt", size: "L", qty: 1, lineId: "line_b", variantId: "var_b", unitPriceEgp: 120 },
    ]

    // Increase line_a to 2
    state = updateCartLineQty(state, { productSlug: "signal-line", size: "M", lineId: "line_a" }, 2)
    expect(state[0].qty).toBe(2)
    expect(state[1].qty).toBe(1)

    // Increase line_b to 3
    state = updateCartLineQty(state, { productSlug: "quiet-revolt", size: "L", lineId: "line_b" }, 3)
    expect(state[0].qty).toBe(2)
    expect(state[1].qty).toBe(3)

    // Increase line_a again to 5
    state = updateCartLineQty(state, { productSlug: "signal-line", size: "M", lineId: "line_a" }, 5)
    expect(state[0].qty).toBe(5)
    expect(state[1].qty).toBe(3)
  })

  it("handles rapid decrease then remove for one line without affecting others", () => {
    let state: CartLine[] = [
      { productSlug: "signal-line", size: "M", qty: 3, lineId: "line_a", variantId: "var_a", unitPriceEgp: 100 },
      { productSlug: "quiet-revolt", size: "L", qty: 2, lineId: "line_b", variantId: "var_b", unitPriceEgp: 120 },
    ]

    // Decrease line_a to 2
    state = updateCartLineQty(state, { productSlug: "signal-line", size: "M", lineId: "line_a" }, 2)
    expect(state[0].qty).toBe(2)
    expect(state[1].qty).toBe(2)

    // Remove line_a entirely (qty = 0)
    state = updateCartLineQty(state, { productSlug: "signal-line", size: "M", lineId: "line_a" }, 0)
    expect(state).toHaveLength(1)
    expect(state[0].productSlug).toBe("quiet-revolt")
    expect(state[0].qty).toBe(2)
  })
})
