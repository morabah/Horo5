import {
  asLaunchAudience,
  asLaunchDesign,
  asLaunchGroup,
  asZodiacSign,
} from "../launch-taxonomy"

describe("launch-taxonomy parsers", () => {
  it("accepts valid launch group values", () => {
    expect(asLaunchGroup("zodiac_capsule")).toBe("zodiac_capsule")
    expect(asLaunchGroup("mood")).toBe("mood")
    expect(asLaunchGroup("lifestyle")).toBe("lifestyle")
  })

  it("rejects invalid launch group values", () => {
    expect(asLaunchGroup("zodiac")).toBeUndefined()
    expect(asLaunchGroup("")).toBeUndefined()
    expect(asLaunchGroup(null)).toBeUndefined()
  })

  it("accepts valid launch audience and design values", () => {
    expect(asLaunchAudience("women")).toBe("women")
    expect(asLaunchDesign("i-care")).toBe("i-care")
    expect(asZodiacSign("virgo")).toBe("virgo")
  })
})
