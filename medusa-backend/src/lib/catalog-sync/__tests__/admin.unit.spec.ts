import { buildCatalogSyncOptionsFromAdminBody } from "../admin"

describe("buildCatalogSyncOptionsFromAdminBody", () => {
  it("parses boolean flags from various truthy values", () => {
    const result = buildCatalogSyncOptionsFromAdminBody(
      { force: true, noStock: "true", noInventory: 1, allowPartial: "1" },
      false,
    )
    expect(result.dryRun).toBe(false)
    expect(result.force).toBe(true)
    expect(result.noStock).toBe(true)
    expect(result.noInventory).toBe(true)
    expect(result.allowPartial).toBe(true)
  })

  it("defaults booleans to false", () => {
    const result = buildCatalogSyncOptionsFromAdminBody({}, false)
    expect(result.force).toBe(false)
    expect(result.noStock).toBe(false)
    expect(result.noInventory).toBe(false)
    expect(result.allowPartial).toBe(false)
  })

  it("parses comma-separated only handles", () => {
    const result = buildCatalogSyncOptionsFromAdminBody({ only: "a,b, c" }, false)
    expect(result.onlyHandles).toEqual(new Set(["a", "b", "c"]))
  })

  it("parses array only handles", () => {
    const result = buildCatalogSyncOptionsFromAdminBody({ only: ["a", "b ", "c"] }, false)
    expect(result.onlyHandles).toEqual(new Set(["a", "b", "c"]))
  })

  it("returns undefined for empty only", () => {
    const result = buildCatalogSyncOptionsFromAdminBody({ only: "" }, false)
    expect(result.onlyHandles).toBeUndefined()
  })

  it("uses csvSource from body when provided", () => {
    const result = buildCatalogSyncOptionsFromAdminBody({ csvSource: "https://sheet.test/data.csv" }, false)
    expect(result.csvSource).toBe("https://sheet.test/data.csv")
  })

  it("falls back to env CATALOG_SHEET_CSV_URL", () => {
    const result = buildCatalogSyncOptionsFromAdminBody({}, false, { CATALOG_SHEET_CSV_URL: "https://env.test/data.csv" })
    expect(result.csvSource).toBe("https://env.test/data.csv")
  })

  it("respects dryRun parameter", () => {
    const result = buildCatalogSyncOptionsFromAdminBody({}, true)
    expect(result.dryRun).toBe(true)
  })
})
