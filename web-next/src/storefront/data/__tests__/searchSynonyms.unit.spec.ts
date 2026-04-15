import {
  ADDITIONAL_COMMON_QUERY_EXPANSIONS,
  ADDITIONAL_FEELING_ALIASES,
  ADDITIONAL_OCCASION_ALIASES,
} from "../searchSynonyms"

describe("searchSynonyms data maps", () => {
  it("uses non-empty string arrays for expansions and aliases", () => {
    for (const [key, values] of Object.entries(ADDITIONAL_COMMON_QUERY_EXPANSIONS)) {
      expect(key.length).toBeGreaterThan(0)
      expect(Array.isArray(values)).toBe(true)
      expect(values.length).toBeGreaterThan(0)
      expect(values.every((v) => typeof v === "string" && v.length > 0)).toBe(true)
    }
    for (const [key, values] of Object.entries(ADDITIONAL_FEELING_ALIASES)) {
      expect(key.length).toBeGreaterThan(0)
      expect(values.length).toBeGreaterThan(0)
    }
    for (const [key, values] of Object.entries(ADDITIONAL_OCCASION_ALIASES)) {
      expect(key.length).toBeGreaterThan(0)
      expect(values.length).toBeGreaterThan(0)
    }
  })
})
