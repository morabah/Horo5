import {
  productReferencesFeelingSlug,
  productReferencesOccasionSlug,
  productReferencesSubfeelingSlug,
} from "../taxonomy-product-links"

describe("taxonomy-product-links", () => {
  it("detects feeling by primary or legacy slug", () => {
    expect(
      productReferencesFeelingSlug(
        { id: "1", metadata: { primaryFeelingSlug: "mood" } },
        "mood"
      )
    ).toBe(true)
    expect(
      productReferencesFeelingSlug({ id: "1", metadata: { feelingSlug: "mood" } }, "mood")
    ).toBe(true)
    expect(productReferencesFeelingSlug({ id: "1", metadata: { primaryFeelingSlug: "zodiac" } }, "mood")).toBe(
      false
    )
  })

  it("detects subfeeling by primary or line slug", () => {
    expect(
      productReferencesSubfeelingSlug({ id: "1", metadata: { primarySubfeelingSlug: "i-care" } }, "i-care")
    ).toBe(true)
    expect(productReferencesSubfeelingSlug({ id: "1", metadata: { lineSlug: "i-care" } }, "i-care")).toBe(true)
  })

  it("detects occasion in list or primary", () => {
    expect(
      productReferencesOccasionSlug(
        { id: "1", metadata: { occasionSlugs: ["a", "b"], primaryOccasionSlug: "c" } },
        "b"
      )
    ).toBe(true)
    expect(
      productReferencesOccasionSlug({ id: "1", metadata: { primaryOccasionSlug: "gift-something-real" } }, "gift-something-real")
    ).toBe(true)
  })
})
