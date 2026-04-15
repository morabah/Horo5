import { LEGACY_VIBE_SLUG_TO_FEELING_SLUG, mapLegacyFeelingSlug } from "../legacy-slugs"

describe("mapLegacyFeelingSlug", () => {
  it("maps legacy vibe keys to canonical feeling slugs", () => {
    expect(mapLegacyFeelingSlug("soft-quiet")).toBe("mood")
    expect(mapLegacyFeelingSlug("bold-electric")).toBe("trends")
    expect(mapLegacyFeelingSlug("emotions")).toBe("mood")
  })

  it("passes through unknown slugs", () => {
    expect(mapLegacyFeelingSlug("custom-leaf")).toBe("custom-leaf")
  })

  it("keeps canonical keys stable", () => {
    for (const [legacy, canonical] of Object.entries(LEGACY_VIBE_SLUG_TO_FEELING_SLUG)) {
      expect(mapLegacyFeelingSlug(legacy)).toBe(canonical)
    }
  })
})
