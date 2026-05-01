import fs from "node:fs/promises"
import path from "node:path"

import { PRODUCT_SIZE_KEYS } from "../../lib/shared/constants"
import {
  buildMarkdownReport,
  galleryTagForFilename,
  parseCatalogSyncArgs,
  parseCommaList,
  parseSheetRows,
  parseSizes,
  parseStockPerSize,
  runCatalogSync,
  validateCatalogRows,
} from "../sync-catalog-from-sheet"

const backendRoot = path.resolve(__dirname, "../../..")

async function listFiles(root: string, current = root): Promise<string[]> {
  const entries = await fs.readdir(current, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const absolutePath = path.join(current, entry.name)
    if (entry.isDirectory()) {
      files.push(...await listFiles(root, absolutePath))
    } else if (entry.name !== ".synced") {
      files.push(path.relative(root, absolutePath).split(path.sep).join("/"))
    }
  }
  return files.sort()
}

describe("catalog sheet parsers", () => {
  it("parses comma lists and sizes", () => {
    expect(parseCommaList(" mood, fiction ,, career ")).toEqual(["mood", "fiction", "career"])
    expect(parseSizes("s, M, xl")).toEqual(["S", "M", "XL"])
    expect(parseSizes("")).toEqual([...PRODUCT_SIZE_KEYS])
  })

  it("parses stockPerSize in uniform and mapped forms", () => {
    expect(parseStockPerSize("50", ["S", "M"] as any)).toEqual({ S: 50, M: 50 })
    expect(parseStockPerSize("S:30,M:60", ["S", "M"] as any)).toEqual({ S: 30, M: 60 })
    expect(() => parseStockPerSize("S:30", ["S", "M"] as any)).toThrow("missing quantities")
    expect(() => parseStockPerSize("XS:30", ["S"] as any)).toThrow("Invalid stockPerSize size")
  })

  it("maps inbox filenames to gallery tags", () => {
    expect(galleryTagForFilename("lifestyle-1.jpg")).toBe("lifestyle")
    expect(galleryTagForFilename("flat_lay.png")).toBe("flat_lay")
    expect(galleryTagForFilename("proof_print-close.webp")).toBe("proof_print")
    expect(galleryTagForFilename("detail.jpg")).toBeUndefined()
  })
})

describe("catalog row validation", () => {
  it("reports row-numbered validation errors", async () => {
    const csv = [
      "handle,status,title,story,feeling,subfeeling,priceEgp,imageFolder,stockPerSize",
      "Bad Handle,ready,,Story,mood,i-care,abc,inbox/missing,S:1",
    ].join("\n")

    const { rows, issues } = await validateCatalogRows(parseSheetRows(csv), backendRoot)

    expect(rows).toHaveLength(1)
    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rowNumber: 2, field: "handle" }),
        expect.objectContaining({ rowNumber: 2, field: "priceEgp" }),
      ]),
    )
  })
})

describe("catalog sync dry-run scaffold", () => {
  it("generates the expected drops tree from a fixture sheet and inbox", async () => {
    const options = parseCatalogSyncArgs([
      "--dry-run",
      "--csv=src/scripts/__tests__/fixtures/catalog-sync/products.csv",
    ])
    const report = await runCatalogSync({ cwd: backendRoot, options })

    expect(report.validationIssues).toEqual([])
    expect(report.stageErrors).toEqual([])
    expect(report.scaffoldResults).toEqual(expect.arrayContaining([
      expect.objectContaining({
        handle: "quiet-revolt",
        status: "added",
      }),
      expect.objectContaining({
        handle: "future-draft",
        status: "skipped",
      }),
    ]))

    const dropDir = path.join(report.tempDir!, "drops/quiet-revolt")
    const productYaml = await fs.readFile(path.join(dropDir, "product.yaml"), "utf-8")
    const files = await listFiles(dropDir)

    expect({ files, productYaml }).toMatchSnapshot()
  })

  it("summarizes validation and stage state in markdown", () => {
    const markdown = buildMarkdownReport({
      csvSource: "fixture.csv",
      dryRun: true,
      scopedHandles: ["quiet-revolt"],
      tempDir: "/tmp/catalog-sync",
      fetchedRows: 1,
      selectedRows: 1,
      readyRows: 1,
      draftRows: 0,
      archivedRows: 0,
      validationIssues: [],
      scaffoldResults: [],
      importHandles: [],
      stockMap: {},
      stageErrors: [],
    })

    expect(markdown).toContain("# Catalog Sync Report")
    expect(markdown).toContain("| Ready rows | 1 |")
    expect(markdown).toContain("- Import: skipped for dry-run")
  })
})
