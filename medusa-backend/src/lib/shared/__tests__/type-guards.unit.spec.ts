import {
  asRecord,
  asRecordOrNull,
  asString,
  asStringOrEmpty,
  asStringArray,
  asStringArrayOrEmpty,
  asNumber,
  parseInteger,
} from "../type-guards"

describe("asRecord", () => {
  it("returns the object for a plain object", () => {
    const obj = { a: 1 }
    expect(asRecord(obj)).toBe(obj)
  })

  it("returns empty object for null", () => {
    expect(asRecord(null)).toEqual({})
  })

  it("returns empty object for undefined", () => {
    expect(asRecord(undefined)).toEqual({})
  })

  it("returns empty object for arrays", () => {
    expect(asRecord([1, 2, 3])).toEqual({})
  })

  it("returns empty object for strings", () => {
    expect(asRecord("hello")).toEqual({})
  })

  it("returns empty object for numbers", () => {
    expect(asRecord(42)).toEqual({})
  })
})

describe("asRecordOrNull", () => {
  it("returns the object for a plain object", () => {
    const obj = { b: 2 }
    expect(asRecordOrNull(obj)).toBe(obj)
  })

  it("returns null for null", () => {
    expect(asRecordOrNull(null)).toBeNull()
  })

  it("returns null for undefined", () => {
    expect(asRecordOrNull(undefined)).toBeNull()
  })

  it("returns null for arrays", () => {
    expect(asRecordOrNull([1])).toBeNull()
  })
})

describe("asString", () => {
  it("returns trimmed non-empty strings", () => {
    expect(asString("hello")).toBe("hello")
    expect(asString("  hello  ")).toBe("hello")
  })

  it("returns undefined for empty strings", () => {
    expect(asString("")).toBeUndefined()
    expect(asString("   ")).toBeUndefined()
  })

  it("returns undefined for non-strings", () => {
    expect(asString(42)).toBeUndefined()
    expect(asString(null)).toBeUndefined()
    expect(asString(undefined)).toBeUndefined()
    expect(asString({})).toBeUndefined()
  })
})

describe("asStringOrEmpty", () => {
  it("returns trimmed strings", () => {
    expect(asStringOrEmpty("hello")).toBe("hello")
    expect(asStringOrEmpty("  hello  ")).toBe("hello")
  })

  it("returns empty string for empty or whitespace-only input", () => {
    expect(asStringOrEmpty("")).toBe("")
    expect(asStringOrEmpty("   ")).toBe("")
  })

  it("returns empty string for non-strings", () => {
    expect(asStringOrEmpty(42)).toBe("")
    expect(asStringOrEmpty(null)).toBe("")
  })
})

describe("asStringArray", () => {
  it("returns non-empty string array", () => {
    expect(asStringArray(["a", "b", "c"])).toEqual(["a", "b", "c"])
  })

  it("filters empty strings", () => {
    expect(asStringArray(["a", "", "  ", "b"])).toEqual(["a", "b"])
  })

  it("returns undefined for non-array", () => {
    expect(asStringArray("not array")).toBeUndefined()
  })

  it("returns undefined for empty array after filtering", () => {
    expect(asStringArray(["", "  "])).toBeUndefined()
  })

  it("filters non-string items", () => {
    expect(asStringArray(["a", 1, null, "b"])).toEqual(["a", "b"])
  })
})

describe("asStringArrayOrEmpty", () => {
  it("returns non-empty string array", () => {
    expect(asStringArrayOrEmpty(["a", "b"])).toEqual(["a", "b"])
  })

  it("coerces items to strings", () => {
    expect(asStringArrayOrEmpty([1, null, "b"])).toEqual(["1", "b"])
  })

  it("returns empty array for non-array", () => {
    expect(asStringArrayOrEmpty("not array")).toEqual([])
  })
})

describe("asNumber", () => {
  it("returns finite numbers", () => {
    expect(asNumber(42)).toBe(42)
    expect(asNumber(3.14)).toBe(3.14)
    expect(asNumber(0)).toBe(0)
    expect(asNumber(-1)).toBe(-1)
  })

  it("returns undefined for NaN", () => {
    expect(asNumber(NaN)).toBeUndefined()
  })

  it("returns undefined for Infinity", () => {
    expect(asNumber(Infinity)).toBeUndefined()
    expect(asNumber(-Infinity)).toBeUndefined()
  })

  it("returns undefined for non-numbers", () => {
    expect(asNumber("42")).toBeUndefined()
    expect(asNumber(null)).toBeUndefined()
  })
})

describe("parseInteger", () => {
  it("truncates numbers to integers", () => {
    expect(parseInteger(42.7)).toBe(42)
    expect(parseInteger(-3.9)).toBe(-3)
    expect(parseInteger(0)).toBe(0)
  })

  it("parses integer strings", () => {
    expect(parseInteger("42")).toBe(42)
    expect(parseInteger("  7  ")).toBe(7)
  })

  it("truncates float strings", () => {
    expect(parseInteger("3.99")).toBe(3)
  })

  it("returns null for non-numeric strings", () => {
    expect(parseInteger("abc")).toBeNull()
    expect(parseInteger("")).toBeNull()
  })

  it("returns null for non-numeric values", () => {
    expect(parseInteger(null)).toBeNull()
    expect(parseInteger(undefined)).toBeNull()
    expect(parseInteger({})).toBeNull()
  })
})
