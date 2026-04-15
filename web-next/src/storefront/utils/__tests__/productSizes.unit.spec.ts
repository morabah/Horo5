import type { Product, ProductVariantRecord } from "../../data/catalog-types"
import { defaultCatalogSizeKeys, productAvailableSizes, productHasCatalogSize } from "../productSizes"

function variant(partial: Partial<ProductVariantRecord> & Pick<ProductVariantRecord, "id" | "size" | "priceEgp">) {
  return {
    manageInventory: false,
    allowBackorder: true,
    available: true,
    ...partial,
  } satisfies ProductVariantRecord
}

function baseProduct(overrides: Partial<Product> = {}): Product {
  return {
    slug: "p",
    name: "P",
    artistSlug: "a",
    feelingSlug: "mood",
    occasionSlugs: [],
    priceEgp: 100,
    story: "",
    ...overrides,
  }
}

describe("defaultCatalogSizeKeys", () => {
  it("returns a non-empty ordered size list from PDP schema", () => {
    const keys = defaultCatalogSizeKeys()
    expect(keys.length).toBeGreaterThan(0)
    expect(keys).toContain("M")
  })
})

describe("productAvailableSizes", () => {
  it("filters to variants marked available when variants exist", () => {
    const p = baseProduct({
      variantsBySize: {
        S: variant({ id: "s", size: "S", priceEgp: 100, available: false }),
        M: variant({ id: "m", size: "M", priceEgp: 100, available: true }),
        L: variant({ id: "l", size: "L", priceEgp: 100, available: true }),
      },
    })
    const avail = productAvailableSizes(p)
    expect(avail).toContain("M")
    expect(avail).toContain("L")
    expect(avail).not.toContain("S")
  })

  it("uses availableSizes whitelist when no variants", () => {
    const base = defaultCatalogSizeKeys()
    const p = baseProduct({
      availableSizes: ["M", "L"],
    })
    const avail = productAvailableSizes(p)
    expect(avail).toEqual(base.filter((k) => k === "M" || k === "L"))
  })
})

describe("productHasCatalogSize", () => {
  it("delegates to productAvailableSizes", () => {
    const p = baseProduct({
      variantsBySize: {
        M: variant({ id: "m", size: "M", priceEgp: 100, available: true }),
      },
    })
    expect(productHasCatalogSize(p, "M")).toBe(true)
    expect(productHasCatalogSize(p, "XS")).toBe(false)
  })
})
