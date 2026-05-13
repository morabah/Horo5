import {
  buildMarkdownReport,
  galleryTagForFilename,
  parseCommaList,
  parseCsv,
  parseSheetRows,
  parseSizes,
  parseStockPerSize,
} from "../sync"
import type { CatalogSyncReport } from "../types"

describe("parseCsv", () => {
  it("parses simple comma-separated values", () => {
    expect(parseCsv("a,b,c\n1,2,3")).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ])
  })

  it("parses quoted fields with commas", () => {
    expect(parseCsv('a,"b,c",d\n1,2,3')).toEqual([
      ["a", "b,c", "d"],
      ["1", "2", "3"],
    ])
  })

  it("parses escaped quotes", () => {
    expect(parseCsv('a,"b""c",d')).toEqual([["a", 'b"c', "d"]])
  })

  it("ignores carriage returns", () => {
    expect(parseCsv("a,b\r\nc,d")).toEqual([
      ["a", "b"],
      ["c", "d"],
    ])
  })

  it("filters empty rows", () => {
    expect(parseCsv("a,b\n\n\nc,d")).toEqual([
      ["a", "b"],
      ["c", "d"],
    ])
  })
})

describe("parseSheetRows", () => {
  it("maps headers to values by row", () => {
    const rows = parseSheetRows("handle,title\nfoo,Foo\nbar,Bar")
    expect(rows).toHaveLength(2)
    expect(rows[0]).toEqual({ rowNumber: 2, values: { handle: "foo", title: "Foo" } })
    expect(rows[1]).toEqual({ rowNumber: 3, values: { handle: "bar", title: "Bar" } })
  })

  it("returns empty for empty csv", () => {
    expect(parseSheetRows("")).toEqual([])
  })

  it("strips BOM from headers", () => {
    const rows = parseSheetRows("\uFEFFhandle,title\nfoo,Foo")
    expect(rows[0]?.values).toEqual({ handle: "foo", title: "Foo" })
  })
})

describe("parseCommaList", () => {
  it("splits and trims comma-separated values", () => {
    expect(parseCommaList("a,b, c")).toEqual(["a", "b", "c"])
  })

  it("returns empty for undefined", () => {
    expect(parseCommaList(undefined)).toEqual([])
  })

  it("filters empty strings", () => {
    expect(parseCommaList("a,,b")).toEqual(["a", "b"])
  })
})

describe("parseSizes", () => {
  it("returns defaults for empty input", () => {
    const result = parseSizes("")
    expect(result).toEqual(["S", "M", "L", "XL", "XXL"])
  })

  it("parses and upper-cases comma-separated sizes", () => {
    expect(parseSizes("s,m,l")).toEqual(["S", "M", "L"])
  })
})

describe("parseStockPerSize", () => {
  it("returns undefined for empty input", () => {
    expect(parseStockPerSize("")).toBeUndefined()
  })

  it("spreads a single number across all sizes", () => {
    const result = parseStockPerSize("50")
    expect(result).toEqual({ S: 50, M: 50, L: 50, XL: 50, XXL: 50 })
  })

  it("parses per-size quantities", () => {
    const result = parseStockPerSize("S:10,M:20,L:30,XL:40,XXL:50")
    expect(result).toEqual({ S: 10, M: 20, L: 30, XL: 40, XXL: 50 })
  })

  it("throws for invalid size", () => {
    expect(() => parseStockPerSize("XXXL:10")).toThrow(/Invalid stockPerSize size/)
  })

  it("throws for non-numeric quantity", () => {
    expect(() => parseStockPerSize("S:abc")).toThrow(/Invalid stockPerSize quantity/)
  })

  it("throws for missing sizes", () => {
    expect(() => parseStockPerSize("S:10")).toThrow(/missing quantities for/)
  })

  it("throws for duplicate size entries", () => {
    expect(() => parseStockPerSize("S:10,S:20")).toThrow(/Duplicate stockPerSize entry/)
  })

  it("throws for malformed segment", () => {
    expect(() => parseStockPerSize("S:10:extra")).toThrow(/Invalid stockPerSize segment/)
  })
})

describe("galleryTagForFilename", () => {
  it("maps filename prefixes to tags", () => {
    expect(galleryTagForFilename("lifestyle-1.jpg")).toBe("lifestyle")
    expect(galleryTagForFilename("flat_lay-1.png")).toBe("flat_lay")
    expect(galleryTagForFilename("proof_fabric-1.webp")).toBe("proof_fabric")
    expect(galleryTagForFilename("proof_print-1.jpg")).toBe("proof_print")
    expect(galleryTagForFilename("proof_wash-1.jpg")).toBe("proof_wash")
  })

  it("returns undefined for unknown prefixes", () => {
    expect(galleryTagForFilename("random.jpg")).toBeUndefined()
  })
})

describe("buildMarkdownReport", () => {
  it("renders summary and validation sections", () => {
    const report: CatalogSyncReport = {
      csvSource: "https://sheet.test/data.csv",
      dryRun: true,
      fetchedRows: 10,
      selectedRows: 8,
      readyRows: 5,
      draftRows: 2,
      archivedRows: 1,
      validationIssues: [
        { rowNumber: 3, handle: "foo", field: "price", message: "Missing price" },
      ],
      scaffoldResults: [
        { rowNumber: 5, handle: "bar", status: "added", message: "Created" },
      ],
      importHandles: ["bar"],
      stockMap: { bar: { M: 10 } },
      stageErrors: [],
      scopedHandles: [],
      tempDir: "/tmp/horo-catalog-sync-abc123",
    }

    const markdown = buildMarkdownReport(report)
    expect(markdown).toContain("# Catalog Sync Report")
    expect(markdown).toContain("Source: https://sheet.test/data.csv")
    expect(markdown).toContain("Mode: dry-run")
    expect(markdown).toContain("Dry-run output: /tmp/horo-catalog-sync-abc123")
    expect(markdown).toContain("Fetched rows | 10")
    expect(markdown).toContain("Missing price")
    expect(markdown).toContain("bar | added")
    expect(markdown).toContain("Import: skipped for dry-run")
  })

  it("renders empty states", () => {
    const report: CatalogSyncReport = {
      csvSource: "https://sheet.test/data.csv",
      dryRun: false,
      fetchedRows: 0,
      selectedRows: 0,
      readyRows: 0,
      draftRows: 0,
      archivedRows: 0,
      validationIssues: [],
      scaffoldResults: [],
      importHandles: [],
      stockMap: {},
      stageErrors: [],
      scopedHandles: [],
    }

    const markdown = buildMarkdownReport(report)
    expect(markdown).toContain("No validation errors.")
    expect(markdown).toContain("No ready rows were scaffolded.")
    expect(markdown).toContain("Mode: write")
  })
})
