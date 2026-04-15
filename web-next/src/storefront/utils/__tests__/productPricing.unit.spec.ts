import type { Product, ProductVariantRecord } from "../../data/catalog-types"
import {
  compareAtPrice,
  getDefaultPriceSelection,
  getDisplayPriceSelection,
  orderedVariantEntries,
  productHasVariablePricing,
} from "../productPricing"

function variant(partial: Partial<ProductVariantRecord> & Pick<ProductVariantRecord, "id" | "size" | "priceEgp">) {
  return {
    manageInventory: false,
    allowBackorder: true,
    available: true,
    ...partial,
  } satisfies ProductVariantRecord
}

function product(partial: Partial<Product> & Pick<Product, "slug" | "name" | "artistSlug" | "feelingSlug" | "priceEgp" | "story" | "occasionSlugs">): Product {
  return {
    ...partial,
  }
}

describe("orderedVariantEntries", () => {
  it("orders sizes XS…XXL and drops undefined variants", () => {
    const p = product({
      slug: "t",
      name: "T",
      artistSlug: "a",
      feelingSlug: "mood",
      priceEgp: 100,
      story: "",
      occasionSlugs: [],
      variantsBySize: {
        L: variant({ id: "l", size: "L", priceEgp: 100 }),
        XS: variant({ id: "xs", size: "XS", priceEgp: 100 }),
        M: variant({ id: "m", size: "M", priceEgp: 100 }),
      },
    })
    expect(orderedVariantEntries(p).map(([s]) => s)).toEqual(["XS", "M", "L"])
  })
})

describe("getDefaultPriceSelection", () => {
  it("uses defaultPriceSize when present", () => {
    const p = product({
      slug: "t",
      name: "T",
      artistSlug: "a",
      feelingSlug: "mood",
      priceEgp: 100,
      story: "",
      occasionSlugs: [],
      defaultPriceSize: "L",
      variantsBySize: {
        M: variant({ id: "m", size: "M", priceEgp: 100, available: false }),
        L: variant({ id: "l", size: "L", priceEgp: 120, available: true }),
      },
    })
    expect(getDefaultPriceSelection(p)).toEqual({ size: "L", variant: p.variantsBySize!.L! })
  })

  it("prefers first available size in catalog order when no default", () => {
    const p = product({
      slug: "t",
      name: "T",
      artistSlug: "a",
      feelingSlug: "mood",
      priceEgp: 100,
      story: "",
      occasionSlugs: [],
      variantsBySize: {
        S: variant({ id: "s", size: "S", priceEgp: 100, available: false }),
        M: variant({ id: "m", size: "M", priceEgp: 100, available: true }),
      },
    })
    expect(getDefaultPriceSelection(p).size).toBe("M")
  })

  it("returns nulls when no variants", () => {
    const p = product({
      slug: "t",
      name: "T",
      artistSlug: "a",
      feelingSlug: "mood",
      priceEgp: 100,
      story: "",
      occasionSlugs: [],
    })
    expect(getDefaultPriceSelection(p)).toEqual({ size: null, variant: null })
  })
})

describe("getDisplayPriceSelection", () => {
  const p = product({
    slug: "t",
    name: "T",
    artistSlug: "a",
    feelingSlug: "mood",
    priceEgp: 100,
    story: "",
    occasionSlugs: [],
    variantsBySize: {
      M: variant({ id: "m", size: "M", priceEgp: 100, available: true }),
    },
  })

  it("marks selected when size exists", () => {
    expect(getDisplayPriceSelection(p, "M")).toEqual({
      isSelected: true,
      size: "M",
      variant: p.variantsBySize!.M!,
    })
  })

  it("falls back when selected size missing", () => {
    const sel = getDisplayPriceSelection(p, "XL")
    expect(sel.isSelected).toBe(false)
    expect(sel.size).toBe("M")
  })
})

describe("compareAtPrice", () => {
  it("returns original only when greater than current", () => {
    expect(compareAtPrice(100, 150)).toBe(150)
    expect(compareAtPrice(100, 100)).toBeNull()
    expect(compareAtPrice(100, 80)).toBeNull()
    expect(compareAtPrice(100, undefined)).toBeNull()
  })
})

describe("productHasVariablePricing", () => {
  it("detects multiple distinct variant prices", () => {
    const p = product({
      slug: "t",
      name: "T",
      artistSlug: "a",
      feelingSlug: "mood",
      priceEgp: 100,
      story: "",
      occasionSlugs: [],
      variantsBySize: {
        S: variant({ id: "s", size: "S", priceEgp: 100, available: true }),
        M: variant({ id: "m", size: "M", priceEgp: 120, available: true }),
      },
    })
    expect(productHasVariablePricing(p)).toBe(true)
  })

  it("is false for single price", () => {
    const p = product({
      slug: "t",
      name: "T",
      artistSlug: "a",
      feelingSlug: "mood",
      priceEgp: 100,
      story: "",
      occasionSlugs: [],
      variantsBySize: {
        M: variant({ id: "m", size: "M", priceEgp: 100, available: true }),
      },
    })
    expect(productHasVariablePricing(p)).toBe(false)
  })
})
