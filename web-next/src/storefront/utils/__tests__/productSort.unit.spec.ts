import type { Product } from "../../data/catalog-types"
import { setRuntimeProducts } from "../../data/site"
import { sortProductList } from "../productSort"

function minimalProduct(
  slug: string,
  priceEgp: number,
): Product {
  return {
    slug,
    name: slug,
    artistSlug: "artist",
    feelingSlug: "mood",
    occasionSlugs: [],
    priceEgp,
    story: "",
  }
}

describe("sortProductList", () => {
  const prev = process.env.NODE_ENV

  afterEach(() => {
    setRuntimeProducts(null)
    ;(process as unknown as { env: { NODE_ENV: string } }).env.NODE_ENV = prev
  })

  beforeEach(() => {
    ;(process as unknown as { env: { NODE_ENV: string } }).env.NODE_ENV = "development"
    setRuntimeProducts([
      minimalProduct("alpha", 300),
      minimalProduct("beta", 100),
      minimalProduct("gamma", 200),
    ])
  })

  it("sorts by price ascending and descending", () => {
    const list = [minimalProduct("gamma", 200), minimalProduct("beta", 100), minimalProduct("alpha", 300)]
    expect(sortProductList(list, "price-asc").map((p) => p.slug)).toEqual(["beta", "gamma", "alpha"])
    expect(sortProductList(list, "price-desc").map((p) => p.slug)).toEqual(["alpha", "gamma", "beta"])
  })

  it("orders featured by runtime catalog index", () => {
    const list = [minimalProduct("gamma", 1), minimalProduct("alpha", 1), minimalProduct("beta", 1)]
    expect(sortProductList(list, "featured").map((p) => p.slug)).toEqual(["alpha", "beta", "gamma"])
  })

  it("newest is reverse of featured index", () => {
    const list = [minimalProduct("alpha", 1), minimalProduct("beta", 1)]
    const featured = sortProductList(list, "featured").map((p) => p.slug)
    const newest = sortProductList(list, "newest").map((p) => p.slug)
    expect(newest).toEqual([...featured].reverse())
  })
})
