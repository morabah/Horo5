/**
 * @jest-environment node
 */

import {
  categoryHandles,
  diffSet,
  snapshotOnly,
} from "../checks"

// categoryPaths is not exported; test via createParitySnapshot integration only.
// We test the exported pure helpers here.

describe("snapshotOnly", () => {
  it("returns the object when it has a snapshot property", () => {
    const payload = {
      meta: { generatedAt: "2026-01-01" },
      snapshot: { productCount: 10 },
    }
    expect(snapshotOnly(payload)).toBe(payload)
  })

  it("returns null for null", () => {
    expect(snapshotOnly(null)).toBeNull()
  })

  it("returns null for arrays", () => {
    expect(snapshotOnly([1, 2, 3])).toBeNull()
  })

  it("returns null for objects without snapshot", () => {
    expect(snapshotOnly({ meta: {} })).toBeNull()
  })
})

describe("diffSet", () => {
  it("returns items in left but not in right", () => {
    expect(diffSet(["a", "b", "c"], ["b", "d"])).toEqual(["a", "c"])
  })

  it("returns empty when left is subset of right", () => {
    expect(diffSet(["a", "b"], ["a", "b", "c"])).toEqual([])
  })

  it("returns all left when right is empty", () => {
    expect(diffSet(["a", "b"], [])).toEqual(["a", "b"])
  })

  it("removes all duplicates present in right", () => {
    expect(diffSet(["a", "a", "b"], ["a"])).toEqual(["b"])
  })
})

describe("categoryHandles", () => {
  it("extracts and sorts handles", () => {
    const snapshot = {
      meta: { generatedAt: "2026-01-01", databaseHint: "test", medusaBackendUrl: null },
      snapshot: {
        productCategories: [
          { path: "Apparel / Tops", handle: "tops", active: true },
          { path: "Apparel / Bottoms", handle: "bottoms", active: true },
          { path: "Apparel / T-Shirts", handle: "t-shirts", active: true },
        ],
        productHandles: [],
        productCount: 0,
        regions: [],
        storeDefaultCurrency: null,
        feelingSlugs: [],
        subfeelingSlugs: [],
        occasionSlugs: [],
        artistSlugs: [],
        merchEventSlugs: [],
        homepageSections: [],
        productThumbnailHosts: [],
      },
    }
    expect(categoryHandles(snapshot as any)).toEqual(["bottoms", "t-shirts", "tops"])
  })

  it("returns empty for empty categories", () => {
    const snapshot = {
      meta: { generatedAt: "", databaseHint: "", medusaBackendUrl: null },
      snapshot: {
        productCategories: [],
        productHandles: [],
        productCount: 0,
        regions: [],
        storeDefaultCurrency: null,
        feelingSlugs: [],
        subfeelingSlugs: [],
        occasionSlugs: [],
        artistSlugs: [],
        merchEventSlugs: [],
        homepageSections: [],
        productThumbnailHosts: [],
      },
    }
    expect(categoryHandles(snapshot as any)).toEqual([])
  })
})
