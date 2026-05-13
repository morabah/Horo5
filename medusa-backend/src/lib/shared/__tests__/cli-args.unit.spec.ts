import { normalizeArgs, readOption } from "../cli-args"

describe("normalizeArgs", () => {
  it("filters non-string values", () => {
    expect(normalizeArgs(["a", 1, "b", null, "c"])).toEqual(["a", "b", "c"])
  })

  it("filters '--' separator", () => {
    expect(normalizeArgs(["a", "--", "b"])).toEqual(["a", "b"])
  })

  it("returns empty array for non-array input", () => {
    expect(normalizeArgs(undefined)).toEqual([])
    expect(normalizeArgs(null)).toEqual([])
    expect(normalizeArgs("string")).toEqual([])
  })

  it("returns empty array for empty array", () => {
    expect(normalizeArgs([])).toEqual([])
  })
})

describe("readOption", () => {
  it("reads inline --name=value syntax", () => {
    expect(readOption(["--stock-map=./map.json"], "--stock-map")).toBe("./map.json")
  })

  it("reads positional --name value syntax", () => {
    expect(readOption(["--stock-map", "./map.json"], "--stock-map")).toBe("./map.json")
  })

  it("returns undefined when option not present", () => {
    expect(readOption(["--other"], "--stock-map")).toBeUndefined()
  })

  it("returns undefined when option is last element with no value", () => {
    expect(readOption(["--stock-map"], "--stock-map")).toBeUndefined()
  })

  it("prefers inline over positional", () => {
    expect(
      readOption(["--stock-map=inline.json", "--stock-map", "positional.json"], "--stock-map")
    ).toBe("inline.json")
  })
})
