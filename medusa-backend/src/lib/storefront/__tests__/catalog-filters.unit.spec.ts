import { aggregateFeelingFacetsFromProducts, filterStorefrontProductsByQuery } from "../catalog"
import type { StorefrontProductDTO } from "../types"

const base = (overrides: Partial<StorefrontProductDTO>): StorefrontProductDTO => ({
  artistSlug: "a",
  feelingSlug: "mood",
  name: "Tee",
  occasionSlugs: ["gift-something-real"],
  primaryFeelingSlug: "mood",
  primarySubfeelingSlug: "i-care",
  priceEgp: 800,
  slug: "tee-one",
  story: "",
  variantsBySize: {},
  ...overrides,
})

describe("filterStorefrontProductsByQuery", () => {
  const products: StorefrontProductDTO[] = [
    base({
      slug: "p1",
      apparelCategoryPath: "apparel/tops/t-shirts",
      decorationType: "graphic",
      occasionSlugs: ["graduation-season"],
    }),
    base({
      slug: "p2",
      apparelCategoryPath: "accessories/hats",
      decorationType: "plain",
      occasionSlugs: ["gift-something-real"],
    }),
  ]

  it("filters by category substring", () => {
    const out = filterStorefrontProductsByQuery(products, { category: "apparel" })
    expect(out.map((p) => p.slug)).toEqual(["p1"])
  })

  it("filters by decoration", () => {
    const out = filterStorefrontProductsByQuery(products, { decoration: "plain" })
    expect(out.map((p) => p.slug)).toEqual(["p2"])
  })

  it("filters by occasion slug", () => {
    const out = filterStorefrontProductsByQuery(products, { occasion: "graduation-season" })
    expect(out.map((p) => p.slug)).toEqual(["p1"])
  })

  it("returns all when no filters", () => {
    const out = filterStorefrontProductsByQuery(products, {})
    expect(out).toHaveLength(2)
  })
})

describe("aggregateFeelingFacetsFromProducts", () => {
  it("counts by primary feeling slug", () => {
    const facets = aggregateFeelingFacetsFromProducts([
      base({ slug: "a", primaryFeelingSlug: "calm", feelingSlug: "legacy" }),
      base({ slug: "b", primaryFeelingSlug: "calm", feelingSlug: "legacy" }),
      base({ slug: "c", primaryFeelingSlug: "bold", feelingSlug: "bold" }),
    ])
    expect(facets.feelings.calm).toBe(2)
    expect(facets.feelings.bold).toBe(1)
  })
})
