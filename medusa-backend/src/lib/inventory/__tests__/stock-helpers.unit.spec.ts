import {
  parseDefaultQty,
  stockQtyForVariant,
  validateStockMap,
  variantSize,
} from "../stock-helpers"

describe("parseDefaultQty", () => {
  it("returns default 50 when no args", () => {
    expect(parseDefaultQty([])).toBe(50)
    expect(parseDefaultQty(undefined)).toBe(50)
  })

  it("returns positional integer", () => {
    expect(parseDefaultQty(["100"])).toBe(100)
  })

  it("ignores flags and non-numeric strings", () => {
    expect(parseDefaultQty(["--dry-run", "200", "--stock-map", "map.json"])).toBe(200)
  })

  it("falls back to storeDefaultQty when provided", () => {
    expect(parseDefaultQty([], 75)).toBe(75)
  })

  it("prefers positional arg over storeDefaultQty", () => {
    expect(parseDefaultQty(["300"], 75)).toBe(300)
  })

  it("throws for non-integers", () => {
    expect(() => parseDefaultQty(["3.5"])).toThrow(/Invalid default quantity/)
  })

  it("throws for non-numeric strings", () => {
    expect(() => parseDefaultQty(["abc"])).toThrow(/Invalid default quantity/)
  })

  it("treats negative-looking args as flags (starts with '-')", () => {
    // -1 is filtered by startsWith("-") so it falls back to default
    expect(parseDefaultQty(["-1"])).toBe(50)
  })
})

describe("validateStockMap", () => {
  it("validates a correct stock map", () => {
    const map = {
      "t-shirt": { S: 10, M: 20, L: 5 },
      hoodie: { XL: 8, XXL: 3 },
    }
    expect(validateStockMap(map)).toEqual(map)
  })

  it("throws for non-object input", () => {
    expect(() => validateStockMap("not an object")).toThrow(/must point to a JSON object/)
    expect(() => validateStockMap(null)).toThrow(/must point to a JSON object/)
    expect(() => validateStockMap([1, 2, 3])).toThrow(/must point to a JSON object/)
  })

  it("throws for non-object product entry", () => {
    expect(() =>
      validateStockMap({ "t-shirt": "not an object" })
    ).toThrow(/must be an object keyed by size/)
  })

  it("throws for unsupported size keys", () => {
    expect(() =>
      validateStockMap({ "t-shirt": { S: 10, XXXL: 5 } })
    ).toThrow(/not a supported size/)
  })

  it("throws for negative quantities", () => {
    expect(() =>
      validateStockMap({ "t-shirt": { S: -1 } })
    ).toThrow(/must be a non-negative integer/)
  })

  it("throws for non-integer quantities", () => {
    expect(() =>
      validateStockMap({ "t-shirt": { S: 3.5 } })
    ).toThrow(/must be a non-negative integer/)
  })
})

describe("variantSize", () => {
  it("extracts size from title", () => {
    expect(variantSize({ id: "v1", title: "M", sku: null, manage_inventory: true })).toBe("M")
    expect(variantSize({ id: "v1", title: "xl", sku: null, manage_inventory: true })).toBe("XL")
  })

  it("extracts size from SKU suffix when title doesn't match", () => {
    expect(variantSize({ id: "v1", title: "Red", sku: "TS-001-L", manage_inventory: true })).toBe("L")
    expect(variantSize({ id: "v1", title: null, sku: "HD-002-XXL", manage_inventory: true })).toBe("XXL")
  })

  it("returns undefined for unknown sizes", () => {
    expect(variantSize({ id: "v1", title: "One Size", sku: "OS-001", manage_inventory: true })).toBeUndefined()
  })
})

describe("stockQtyForVariant", () => {
  const variant = {
    id: "v1",
    title: "M",
    sku: "TS-001-M",
    manage_inventory: true,
    product: { id: "p1", handle: "t-shirt" },
  }

  it("returns default qty when no stock map", () => {
    expect(stockQtyForVariant(variant, 50, undefined)).toBe(50)
  })

  it("returns stock map qty for matching handle and size", () => {
    const map = { "t-shirt": { S: 10, M: 25, L: 15 } }
    expect(stockQtyForVariant(variant, 50, map)).toBe(25)
  })

  it("returns undefined when product handle not in stock map", () => {
    const map = { hoodie: { S: 10 } }
    expect(stockQtyForVariant(variant, 50, map)).toBeUndefined()
  })

  it("falls back to default when size not found in stock map", () => {
    const map = { "t-shirt": { S: 10, L: 15 } }
    expect(stockQtyForVariant(variant, 50, map)).toBe(50)
  })

  it("falls back to default when variant size cannot be determined", () => {
    const noSizeVariant = {
      id: "v2",
      title: "Red",
      sku: "TS-RED",
      manage_inventory: true,
      product: { id: "p1", handle: "t-shirt" },
    }
    const map = { "t-shirt": { S: 10 } }
    expect(stockQtyForVariant(noSizeVariant, 50, map)).toBe(50)
  })
})
