import { buildPromotionContext } from "../promotion-context"

describe("buildPromotionContext", () => {
  it("returns zero item count for empty cart", () => {
    const result = buildPromotionContext({ items: [] })
    expect(result.item_count).toBe(0)
    expect(result.has_gift_wrap).toBe(false)
    expect(result.feeling_slugs).toEqual([])
  })

  it("sums item quantities correctly", () => {
    const result = buildPromotionContext({
      items: [
        { quantity: 2 },
        { quantity: 3 },
        { quantity: 1 },
      ],
    })
    expect(result.item_count).toBe(6)
  })

  it("ignores missing or invalid quantities", () => {
    const result = buildPromotionContext({
      items: [
        { quantity: 2 },
        { quantity: "not a number" },
        {},
        { quantity: null },
      ],
    })
    expect(result.item_count).toBe(2)
  })

  it("detects gift-wrap from product.handle", () => {
    const result = buildPromotionContext({
      items: [
        { quantity: 1, product: { handle: "gift-wrap" } },
        { quantity: 1, product: { handle: "t-shirt" } },
      ],
    })
    expect(result.has_gift_wrap).toBe(true)
  })

  it("detects gift-wrap from line-level product_handle", () => {
    const result = buildPromotionContext({
      items: [
        { quantity: 1, product_handle: "gift-wrap" },
      ],
    })
    expect(result.has_gift_wrap).toBe(true)
  })

  it("returns false for has_gift_wrap when no gift-wrap present", () => {
    const result = buildPromotionContext({
      items: [
        { quantity: 1, product: { handle: "t-shirt" } },
        { quantity: 1, product: { handle: "hoodie" } },
      ],
    })
    expect(result.has_gift_wrap).toBe(false)
  })

  it("collects feelingSlugs from product metadata", () => {
    const result = buildPromotionContext({
      items: [
        { quantity: 1, product: { metadata: { feelingSlug: "zodiac" } } },
        { quantity: 1, product: { metadata: { feelingSlug: "birthday" } } },
        { quantity: 1, product: { metadata: { feelingSlug: "zodiac" } } },
      ],
    })
    expect(result.feeling_slugs).toEqual(["zodiac", "birthday"])
  })

  it("collects feelingSlugs from line-level metadata", () => {
    const result = buildPromotionContext({
      items: [
        { quantity: 1, metadata: { feelingSlug: "love" } },
        { quantity: 1, metadata: { feelingSlug: "career" } },
      ],
    })
    expect(result.feeling_slugs).toEqual(["love", "career"])
  })

  it("merges feelingSlugs from both product and line metadata", () => {
    const result = buildPromotionContext({
      items: [
        { quantity: 1, product: { metadata: { feelingSlug: "zodiac" } }, metadata: { feelingSlug: "love" } },
      ],
    })
    expect(result.feeling_slugs).toEqual(["zodiac", "love"])
  })

  it("handles missing items field", () => {
    const result = buildPromotionContext({})
    expect(result.item_count).toBe(0)
    expect(result.has_gift_wrap).toBe(false)
    expect(result.feeling_slugs).toEqual([])
  })

  it("handles items as non-array", () => {
    const result = buildPromotionContext({ items: "not an array" })
    expect(result.item_count).toBe(0)
    expect(result.has_gift_wrap).toBe(false)
    expect(result.feeling_slugs).toEqual([])
  })

  it("ignores empty feelingSlug strings", () => {
    const result = buildPromotionContext({
      items: [
        { quantity: 1, product: { metadata: { feelingSlug: "" } } },
        { quantity: 1, product: { metadata: { feelingSlug: "  " } } },
      ],
    })
    expect(result.feeling_slugs).toEqual([])
  })
})
