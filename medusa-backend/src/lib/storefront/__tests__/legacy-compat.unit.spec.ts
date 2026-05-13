import {
  inferFeelingSlugFromHandle,
  inferSubfeelingSlugFromHandle,
  normalizeFeelingSlug,
  normalizeSubfeelingSlug,
  normalizeLegacyWebFeelingSlug,
  derivePrimarySubfeelingSlugFromLegacyProduct,
} from "../legacy-compat"

describe("inferFeelingSlugFromHandle", () => {
  it("infers feeling from handle prefix", () => {
    expect(inferFeelingSlugFromHandle("emotions-tee")).toBe("mood")
    expect(inferFeelingSlugFromHandle("zodiac-hoodie")).toBe("zodiac")
    expect(inferFeelingSlugFromHandle("fiction-shirt")).toBe("fiction")
    expect(inferFeelingSlugFromHandle("career-tee")).toBe("career")
    expect(inferFeelingSlugFromHandle("trends-hat")).toBe("trends")
  })

  it("defaults to mood when no prefix matches", () => {
    expect(inferFeelingSlugFromHandle("random-product")).toBe("mood")
  })
})

describe("inferSubfeelingSlugFromHandle", () => {
  it("maps silent/deep/unspoken to i-care", () => {
    expect(inferSubfeelingSlugFromHandle("silent-tee", "mood")).toBe("i-care")
    expect(inferSubfeelingSlugFromHandle("deep-tee", "mood")).toBe("i-care")
  })

  it("maps shattered/raw/quiet-revolt to i-dont-care", () => {
    expect(inferSubfeelingSlugFromHandle("shattered-tee", "mood")).toBe("i-dont-care")
    expect(inferSubfeelingSlugFromHandle("quiet-revolt", "mood")).toBe("i-dont-care")
  })

  it("falls back to default subfeeling per feeling", () => {
    expect(inferSubfeelingSlugFromHandle("generic-tee", "career")).toBe("ambition")
    expect(inferSubfeelingSlugFromHandle("generic-tee", "fiction")).toBe("sci-fi")
    expect(inferSubfeelingSlugFromHandle("generic-tee", "trends")).toBe("streetwear")
    expect(inferSubfeelingSlugFromHandle("generic-tee", "zodiac")).toBe("fire-sign")
  })
})

describe("normalizeFeelingSlug", () => {
  it("infers from handle when value is empty", () => {
    expect(normalizeFeelingSlug(undefined, "emotions-tee")).toBe("mood")
  })

  it("maps legacy feeling slugs to taxonomy", () => {
    expect(normalizeFeelingSlug("soft-quiet", "x")).toBe("mood")
    expect(normalizeFeelingSlug("bold-electric", "x")).toBe("trends")
  })

  it("passes through unknown values", () => {
    expect(normalizeFeelingSlug("mood", "x")).toBe("mood")
    expect(normalizeFeelingSlug("custom", "x")).toBe("custom")
  })
})

describe("normalizeSubfeelingSlug", () => {
  it("infers from handle when value is empty", () => {
    expect(normalizeSubfeelingSlug(undefined, "silent-tee", "mood")).toBe("i-care")
  })

  it("maps legacy subfeeling slugs to taxonomy", () => {
    expect(normalizeSubfeelingSlug("emotions", "x", "mood")).toBe("i-care")
    expect(normalizeSubfeelingSlug("zodiac", "x", "zodiac")).toBe("fire-sign")
  })

  it("passes through unknown values", () => {
    expect(normalizeSubfeelingSlug("custom", "x", "mood")).toBe("custom")
  })
})

describe("normalizeLegacyWebFeelingSlug", () => {
  it("maps legacy web slugs to canonical feelings", () => {
    expect(normalizeLegacyWebFeelingSlug("soft-quiet")).toBe("mood")
    expect(normalizeLegacyWebFeelingSlug("warm-romantic")).toBe("zodiac")
    expect(normalizeLegacyWebFeelingSlug("bold-electric")).toBe("trends")
    expect(normalizeLegacyWebFeelingSlug("grounded-everyday")).toBe("career")
    expect(normalizeLegacyWebFeelingSlug("playful-offbeat")).toBe("fiction")
  })

  it("passes through already-canonical slugs", () => {
    expect(normalizeLegacyWebFeelingSlug("mood")).toBe("mood")
    expect(normalizeLegacyWebFeelingSlug("zodiac")).toBe("zodiac")
  })
})

describe("derivePrimarySubfeelingSlugFromLegacyProduct", () => {
  it("derives emotions subfeeling from handle keywords", () => {
    expect(derivePrimarySubfeelingSlugFromLegacyProduct({ slug: "emotions-raw", feelingSlug: "mood" })).toBe("i-dont-care")
    expect(derivePrimarySubfeelingSlugFromLegacyProduct({ slug: "emotions-silent", feelingSlug: "mood" })).toBe("i-care")
    expect(derivePrimarySubfeelingSlugFromLegacyProduct({ slug: "emotions-deep", feelingSlug: "mood" })).toBe("overthinking")
  })

  it("returns feeling defaults for non-emotions handles", () => {
    expect(derivePrimarySubfeelingSlugFromLegacyProduct({ slug: "zodiac-tee", feelingSlug: "zodiac" })).toBe("fire-sign")
    expect(derivePrimarySubfeelingSlugFromLegacyProduct({ slug: "career-tee", feelingSlug: "career" })).toBe("ambition")
    expect(derivePrimarySubfeelingSlugFromLegacyProduct({ slug: "trends-tee", feelingSlug: "trends" })).toBe("streetwear")
    expect(derivePrimarySubfeelingSlugFromLegacyProduct({ slug: "fiction-tee", feelingSlug: "fiction" })).toBe("sci-fi")
  })
})
