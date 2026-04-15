import { parseSearchSizeFilter } from "../view"

describe("parseSearchSizeFilter", () => {
  it("normalizes all / empty / invalid to 'all'", () => {
    expect(parseSearchSizeFilter(null)).toBe("all")
    expect(parseSearchSizeFilter(undefined)).toBe("all")
    expect(parseSearchSizeFilter("")).toBe("all")
    expect(parseSearchSizeFilter("all")).toBe("all")
    expect(parseSearchSizeFilter("XXL-plus")).toBe("all")
  })

  it("accepts valid catalog size keys", () => {
    expect(parseSearchSizeFilter("M")).toBe("M")
    expect(parseSearchSizeFilter("XS")).toBe("XS")
  })
})
