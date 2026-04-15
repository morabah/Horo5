import { humanizeArtistSlugForDisplay } from "../humanizeArtistSlug"

describe("humanizeArtistSlugForDisplay", () => {
  it("title-cases hyphenated slugs", () => {
    expect(humanizeArtistSlugForDisplay("studio-north")).toBe("Studio North")
  })

  it("handles underscores and spaces", () => {
    expect(humanizeArtistSlugForDisplay("a_b  c")).toBe("A B C")
  })

  it("trims and lowercases input", () => {
    expect(humanizeArtistSlugForDisplay("  MixedCase  ")).toBe("Mixedcase")
  })

  it("returns empty for blank", () => {
    expect(humanizeArtistSlugForDisplay("")).toBe("")
    expect(humanizeArtistSlugForDisplay("   ")).toBe("")
  })
})
