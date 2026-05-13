import { buildArtist, buildFeeling, buildOccasion, buildSubfeeling, stockStatusForVariantDto } from "../catalog"
import type { StorefrontVariantDTO } from "../types"

describe("stockStatusForVariantDto", () => {
  const variant = (overrides: Partial<StorefrontVariantDTO> = {}): StorefrontVariantDTO => ({
    id: "var_1",
    allow_backorder: false,
    available: true,
    currency_code: "egp",
    is_discounted: false,
    manage_inventory: true,
    original_price_egp: null,
    price_egp: 800,
    size: "M",
    sku: null,
    inventory_quantity: 100,
    ...overrides,
  })

  it("returns in_stock when quantity is high", () => {
    expect(stockStatusForVariantDto(variant({ inventory_quantity: 20 }))).toBe("in_stock")
  })

  it("returns low_stock when quantity is 10 or below", () => {
    expect(stockStatusForVariantDto(variant({ inventory_quantity: 10 }))).toBe("low_stock")
    expect(stockStatusForVariantDto(variant({ inventory_quantity: 5 }))).toBe("low_stock")
  })

  it("returns sold_out when quantity is 0 and no backorder", () => {
    expect(stockStatusForVariantDto(variant({ inventory_quantity: 0 }))).toBe("sold_out")
  })

  it("returns preorder when managed with backorder and zero/null quantity", () => {
    expect(stockStatusForVariantDto(variant({ inventory_quantity: 0, allow_backorder: true }))).toBe("preorder")
    expect(stockStatusForVariantDto(variant({ inventory_quantity: null, allow_backorder: true }))).toBe("preorder")
  })

  it("returns in_stock when not managing inventory", () => {
    expect(stockStatusForVariantDto(variant({ manage_inventory: false, inventory_quantity: 0 }))).toBe("in_stock")
    expect(stockStatusForVariantDto(variant({ manage_inventory: false, inventory_quantity: null }))).toBe("in_stock")
  })
})

describe("buildArtist", () => {
  it("maps artist record to DTO", () => {
    const result = buildArtist({
      active: true,
      name: "Alice",
      slug: "alice-art",
      design_count: 3,
      avatar_src: "/alice.png",
      style: "Bold",
    })
    expect(result).toEqual({
      active: true,
      avatarSrc: "/alice.png",
      designCount: 3,
      name: "Alice",
      slug: "alice-art",
      style: "Bold",
    })
  })

  it("defaults missing fields", () => {
    const result = buildArtist({ name: "Bob", slug: "bob" })
    expect(result).toEqual({
      active: true,
      avatarSrc: undefined,
      designCount: 0,
      name: "Bob",
      slug: "bob",
      style: "",
    })
  })
})

describe("buildFeeling", () => {
  it("maps feeling record to DTO", () => {
    const result = buildFeeling({
      name: "Mood",
      slug: "mood",
      accent: "#ff0000",
      active: true,
      blurb: "Feel it",
      card_image_src: "/mood.png",
      hero_image_src: "/mood-hero.png",
      manifesto: "Manifesto",
      seo_title: "Mood SEO",
      seo_description: "Desc",
      sort_order: 1,
      tagline: "Tagline",
    })
    expect(result).toEqual({
      accent: "#ff0000",
      active: true,
      blurb: "Feel it",
      cardImageAlt: "Mood",
      cardImageSrc: "/mood.png",
      heroImageAlt: "Mood",
      heroImageSrc: "/mood-hero.png",
      manifesto: "Manifesto",
      name: "Mood",
      seoDescription: "Desc",
      seoTitle: "Mood SEO",
      slug: "mood",
      sortOrder: 1,
      tagline: "Tagline",
    })
  })

  it("falls back card image to empty string and hero to card", () => {
    const result = buildFeeling({ name: "Calm", slug: "calm" })
    expect(result.cardImageSrc).toBe("")
    expect(result.heroImageSrc).toBe("")
  })
})

describe("buildSubfeeling", () => {
  it("maps subfeeling record to DTO", () => {
    const result = buildSubfeeling({
      name: "I Care",
      slug: "i-care",
      feeling_slug: "mood",
      active: true,
      blurb: "Care",
      card_image_src: "/care.png",
      sort_order: 2,
    })
    expect(result).toEqual({
      active: true,
      blurb: "Care",
      cardImageAlt: "I Care",
      cardImageSrc: "/care.png",
      feelingSlug: "mood",
      heroImageAlt: "I Care",
      heroImageSrc: "/care.png",
      name: "I Care",
      seoDescription: undefined,
      seoTitle: undefined,
      slug: "i-care",
      sortOrder: 2,
    })
  })
})

describe("buildOccasion", () => {
  it("maps occasion record to DTO", () => {
    const result = buildOccasion({
      name: "Birthday",
      slug: "birthday",
      active: true,
      blurb: "Celebrate",
      is_gift_occasion: true,
      product_handles: ["gift-tee"],
      price_hint: "Under 500",
      sort_order: 3,
    })
    expect(result).toEqual({
      accent: undefined,
      active: true,
      blurb: "Celebrate",
      cardImageAlt: "Birthday",
      cardImageSrc: "",
      heroImageAlt: "Birthday",
      heroImageSrc: "",
      isGiftOccasion: true,
      name: "Birthday",
      priceHint: "Under 500",
      productHandles: ["gift-tee"],
      seoDescription: undefined,
      seoTitle: undefined,
      slug: "birthday",
      sortOrder: 3,
    })
  })
})
