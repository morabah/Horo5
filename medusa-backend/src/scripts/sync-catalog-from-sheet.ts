import crypto from "node:crypto"
import fs from "node:fs/promises"
import { existsSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import yaml from "js-yaml"

type ProductStatus = "draft" | "ready" | "archived"
type ProductSizeKey = "S" | "M" | "L" | "XL" | "XXL"
type GalleryTag = "proof_fabric" | "proof_print" | "proof_wash" | "lifestyle" | "flat_lay"
type DecorationType = "plain" | "graphic" | "embroidered" | "mixed"

export type StockMap = Record<string, Partial<Record<ProductSizeKey, number>>>

type RawSheetRow = {
  rowNumber: number
  values: Record<string, string>
}

type CatalogRow = {
  rowNumber: number
  handle: string
  status: ProductStatus
  title?: string
  story?: string
  description?: string
  feeling?: string
  subfeeling?: string
  occasions: string[]
  apparelCategory?: string
  priceEgp?: number
  originalPriceEgp?: number
  sizes: ProductSizeKey[]
  garmentColor?: string
  decorationType?: DecorationType
  fitLabel?: string
  trustBadges: string[]
  merchandisingBadge?: string
  stockNote?: string
  sizeTableKey?: string
  artist?: string
  capsuleSlugs: string[]
  complementarySlugs: string[]
  frequentlyBoughtWithSlugs: string[]
  customersAlsoBoughtSlugs: string[]
  launchAt?: string
  sunsetAt?: string
  imageFolder: string
  stockPerSize?: Partial<Record<ProductSizeKey, number>>
  rowHashInput: Record<string, unknown>
}

type ValidationIssue = {
  rowNumber: number
  handle?: string
  field: string
  message: string
}

type ImagePlan = {
  imageFolderAbs: string
  imageFolderRel: string
  main?: {
    sourceAbs: string
    sourceName: string
    targetFile: string
  }
  gallery: Array<{
    sourceAbs: string
    sourceName: string
    targetFile: string
    tag?: GalleryTag
  }>
  imageStampInput: Array<{
    name: string
    mtimeMs: number
    size: number
  }>
  issues: ValidationIssue[]
}

type ScaffoldResult = {
  rowNumber: number
  handle: string
  status: "added" | "changed" | "unchanged" | "skipped" | "error"
  message: string
  dropDir: string
  hash?: string
  importedStampExists?: boolean
  imageSummary?: string
}

type CatalogSyncOptions = {
  dryRun: boolean
  allowPartial: boolean
  force: boolean
  noStock: boolean
  noInventory: boolean
  onlyHandles?: Set<string>
  reportPath?: string
  csvSource?: string
}

type CatalogSyncReport = {
  csvSource: string
  dryRun: boolean
  scopedHandles: string[]
  tempDir?: string
  fetchedRows: number
  selectedRows: number
  readyRows: number
  draftRows: number
  archivedRows: number
  validationIssues: ValidationIssue[]
  scaffoldResults: ScaffoldResult[]
  importHandles: string[]
  stockMap: StockMap
  stageErrors: string[]
}

const DEFAULT_SIZES: readonly ProductSizeKey[] = ["S", "M", "L", "XL", "XXL"]
const SIZE_SET = new Set<string>(DEFAULT_SIZES)
const STATUS_SET = new Set<ProductStatus>(["draft", "ready", "archived"])
const DECORATION_SET = new Set<DecorationType>(["plain", "graphic", "embroidered", "mixed"])
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"])
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const PATH_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/
const SYNC_STAMP_FILE = ".synced"
const IMPORT_STAMP_FILE = ".imported"

const TAG_PREFIXES: Array<{ prefix: string; tag: GalleryTag }> = [
  { prefix: "proof_fabric", tag: "proof_fabric" },
  { prefix: "proof_print", tag: "proof_print" },
  { prefix: "proof_wash", tag: "proof_wash" },
  { prefix: "lifestyle", tag: "lifestyle" },
  { prefix: "flat_lay", tag: "flat_lay" },
]

function getCell(row: RawSheetRow, column: string): string {
  return row.values[column]?.trim() ?? ""
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(value, (_key, item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return item
    return Object.keys(item as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = (item as Record<string, unknown>)[key]
        return acc
      }, {})
  })
}

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex")
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value)
}

function normalizeArgList(args: unknown): string[] {
  return (Array.isArray(args) ? args : [])
    .filter((arg): arg is string => typeof arg === "string")
    .filter((arg) => arg !== "--")
}

function readOption(args: string[], name: string): string | undefined {
  const prefix = `${name}=`
  const inline = args.find((arg) => arg.startsWith(prefix))
  if (inline) return inline.slice(prefix.length)

  const index = args.indexOf(name)
  if (index >= 0) return args[index + 1]
  return undefined
}

export function parseCatalogSyncArgs(args: unknown, env: NodeJS.ProcessEnv = process.env): CatalogSyncOptions {
  const arr = normalizeArgList(args)
  const only = readOption(arr, "--only")
  const reportPath = readOption(arr, "--report")
  const csvSource = readOption(arr, "--csv") ?? env.CATALOG_SHEET_CSV_URL

  return {
    dryRun: arr.includes("--dry-run") || arr.includes("dryrun"),
    allowPartial: arr.includes("--allow-partial"),
    force: arr.includes("--force"),
    noStock: arr.includes("--no-stock"),
    noInventory: arr.includes("--no-inventory"),
    onlyHandles: only
      ? new Set(
          only
            .split(",")
            .map((handle) => handle.trim())
            .filter(Boolean),
        )
      : undefined,
    reportPath,
    csvSource,
  }
}

export function parseCsv(csv: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i]
    const next = csv[i + 1]

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"'
        i++
      } else if (char === '"') {
        inQuotes = false
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
    } else if (char === ",") {
      row.push(field)
      field = ""
    } else if (char === "\n") {
      row.push(field)
      rows.push(row)
      row = []
      field = ""
    } else if (char !== "\r") {
      field += char
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows.filter((r) => r.some((cell) => cell.trim().length > 0))
}

export function parseSheetRows(csv: string): RawSheetRow[] {
  const rows = parseCsv(csv)
  if (!rows.length) return []

  const headers = rows[0].map((header, index) => {
    const normalized = header.replace(/^\uFEFF/, "").trim()
    return normalized || `column_${index + 1}`
  })

  return rows.slice(1).map((cells, index) => {
    const values: Record<string, string> = {}
    for (let i = 0; i < headers.length; i++) {
      values[headers[i]] = (cells[i] ?? "").trim()
    }
    return { rowNumber: index + 2, values }
  })
}

export function parseCommaList(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

export function parseSizes(value: string | undefined): ProductSizeKey[] {
  const parsed = parseCommaList(value)
  if (!parsed.length) return [...DEFAULT_SIZES]

  return parsed.map((size) => size.toUpperCase() as ProductSizeKey)
}

export function parseStockPerSize(
  value: string | undefined,
  sizes: readonly ProductSizeKey[] = DEFAULT_SIZES,
): Partial<Record<ProductSizeKey, number>> | undefined {
  const trimmed = value?.trim()
  if (!trimmed) return undefined

  if (/^\d+$/.test(trimmed)) {
    const qty = Number(trimmed)
    return sizes.reduce<Partial<Record<ProductSizeKey, number>>>((acc, size) => {
      acc[size] = qty
      return acc
    }, {})
  }

  const result: Partial<Record<ProductSizeKey, number>> = {}
  for (const part of parseCommaList(trimmed)) {
    const [rawSize, rawQty, ...extra] = part.split(":")
    if (!rawSize || rawQty === undefined || extra.length) {
      throw new Error(`Invalid stockPerSize segment "${part}". Use 50 or S:30,M:60.`)
    }
    const size = rawSize.trim().toUpperCase()
    const qtyText = rawQty.trim()
    if (!SIZE_SET.has(size)) {
      throw new Error(`Invalid stockPerSize size "${rawSize}". Use S, M, L, XL, or XXL.`)
    }
    if (!/^\d+$/.test(qtyText)) {
      throw new Error(`Invalid stockPerSize quantity "${rawQty}" for ${size}. Use a non-negative integer.`)
    }
    if (result[size as ProductSizeKey] !== undefined) {
      throw new Error(`Duplicate stockPerSize entry for ${size}.`)
    }
    result[size as ProductSizeKey] = Number(qtyText)
  }

  const missing = sizes.filter((size) => result[size] === undefined)
  if (missing.length) {
    throw new Error(`stockPerSize is missing quantities for: ${missing.join(", ")}.`)
  }

  return result
}

function parsePositiveInteger(value: string, field: string): number {
  if (!/^\d+$/.test(value)) {
    throw new Error(`${field} must be a whole EGP integer.`)
  }
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${field} must be greater than 0.`)
  }
  return parsed
}

function validateIsoDate(value: string, field: string): void {
  if (!/^\d{4}-\d{2}-\d{2}T/.test(value) || Number.isNaN(Date.parse(value))) {
    throw new Error(`${field} must be an ISO datetime, e.g. 2026-05-01T00:00:00Z.`)
  }
}

function validateSlugList(issues: ValidationIssue[], row: CatalogRow, field: keyof CatalogRow, values: string[]): void {
  for (const slug of values) {
    if (!SLUG_RE.test(slug)) {
      issues.push({
        rowNumber: row.rowNumber,
        handle: row.handle,
        field: String(field),
        message: `Invalid slug "${slug}". Use lowercase letters, numbers, and hyphens.`,
      })
    }
  }
}

function createIssue(row: RawSheetRow | CatalogRow, field: string, message: string): ValidationIssue {
  return {
    rowNumber: row.rowNumber,
    handle: "handle" in row ? row.handle : getCell(row, "handle") || undefined,
    field,
    message,
  }
}

export function normalizeSheetRow(rawRow: RawSheetRow): { row?: CatalogRow; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = []
  const handle = getCell(rawRow, "handle")
  const statusText = getCell(rawRow, "status").toLowerCase()

  if (!handle) {
    issues.push(createIssue(rawRow, "handle", "handle is required."))
  } else if (!SLUG_RE.test(handle)) {
    issues.push(createIssue(rawRow, "handle", "handle must be a lowercase slug, e.g. quiet-revolt-tee."))
  }

  if (!statusText) {
    issues.push(createIssue(rawRow, "status", "status is required. Use draft, ready, or archived."))
  } else if (!STATUS_SET.has(statusText as ProductStatus)) {
    issues.push(createIssue(rawRow, "status", `Unsupported status "${statusText}". Use draft, ready, or archived.`))
  }

  if (!handle || !STATUS_SET.has(statusText as ProductStatus)) {
    return { issues }
  }

  const status = statusText as ProductStatus
  let sizes: ProductSizeKey[] = [...DEFAULT_SIZES]
  try {
    sizes = parseSizes(getCell(rawRow, "sizes"))
    for (const size of sizes) {
      if (!SIZE_SET.has(size)) {
        issues.push(createIssue(rawRow, "sizes", `Invalid size "${size}". Use S, M, L, XL, or XXL.`))
      }
    }
    if (new Set(sizes).size !== sizes.length) {
      issues.push(createIssue(rawRow, "sizes", "sizes contains a duplicate value."))
    }
  } catch (error) {
    issues.push(createIssue(rawRow, "sizes", error instanceof Error ? error.message : String(error)))
  }

  let priceEgp: number | undefined
  const priceText = getCell(rawRow, "priceEgp")
  if (priceText) {
    try {
      priceEgp = parsePositiveInteger(priceText, "priceEgp")
    } catch (error) {
      issues.push(createIssue(rawRow, "priceEgp", error instanceof Error ? error.message : String(error)))
    }
  }

  let originalPriceEgp: number | undefined
  const originalPriceText = getCell(rawRow, "originalPriceEgp")
  if (originalPriceText) {
    try {
      originalPriceEgp = parsePositiveInteger(originalPriceText, "originalPriceEgp")
    } catch (error) {
      issues.push(createIssue(rawRow, "originalPriceEgp", error instanceof Error ? error.message : String(error)))
    }
  }

  if (priceEgp !== undefined && originalPriceEgp !== undefined && originalPriceEgp <= priceEgp) {
    issues.push(createIssue(rawRow, "originalPriceEgp", "originalPriceEgp must be greater than priceEgp."))
  }

  const decorationText = getCell(rawRow, "decorationType")
  let decorationType: DecorationType | undefined
  if (decorationText) {
    if (DECORATION_SET.has(decorationText as DecorationType)) {
      decorationType = decorationText as DecorationType
    } else {
      issues.push(
        createIssue(rawRow, "decorationType", "decorationType must be plain, graphic, embroidered, or mixed."),
      )
    }
  }

  const launchAt = getCell(rawRow, "launchAt")
  if (launchAt) {
    try {
      validateIsoDate(launchAt, "launchAt")
    } catch (error) {
      issues.push(createIssue(rawRow, "launchAt", error instanceof Error ? error.message : String(error)))
    }
  }

  const sunsetAt = getCell(rawRow, "sunsetAt")
  if (sunsetAt) {
    try {
      validateIsoDate(sunsetAt, "sunsetAt")
    } catch (error) {
      issues.push(createIssue(rawRow, "sunsetAt", error instanceof Error ? error.message : String(error)))
    }
  }

  let stockPerSize: Partial<Record<ProductSizeKey, number>> | undefined
  try {
    stockPerSize = parseStockPerSize(getCell(rawRow, "stockPerSize"), sizes)
  } catch (error) {
    issues.push(createIssue(rawRow, "stockPerSize", error instanceof Error ? error.message : String(error)))
  }

  const row: CatalogRow = {
    rowNumber: rawRow.rowNumber,
    handle,
    status,
    title: getCell(rawRow, "title") || undefined,
    story: getCell(rawRow, "story") || undefined,
    description: getCell(rawRow, "description") || undefined,
    feeling: getCell(rawRow, "feeling") || undefined,
    subfeeling: getCell(rawRow, "subfeeling") || undefined,
    occasions: parseCommaList(getCell(rawRow, "occasions")),
    apparelCategory: getCell(rawRow, "apparelCategory") || undefined,
    priceEgp,
    originalPriceEgp,
    sizes,
    garmentColor: getCell(rawRow, "garmentColor") || undefined,
    decorationType,
    fitLabel: getCell(rawRow, "fitLabel") || undefined,
    trustBadges: parseCommaList(getCell(rawRow, "trustBadges")),
    merchandisingBadge: getCell(rawRow, "merchandisingBadge") || undefined,
    stockNote: getCell(rawRow, "stockNote") || undefined,
    sizeTableKey: getCell(rawRow, "sizeTableKey") || undefined,
    artist: getCell(rawRow, "artist") || undefined,
    capsuleSlugs: parseCommaList(getCell(rawRow, "capsuleSlugs")),
    complementarySlugs: parseCommaList(getCell(rawRow, "complementarySlugs")),
    frequentlyBoughtWithSlugs: parseCommaList(getCell(rawRow, "frequentlyBoughtWithSlugs")),
    customersAlsoBoughtSlugs: parseCommaList(getCell(rawRow, "customersAlsoBoughtSlugs")),
    launchAt: launchAt || undefined,
    sunsetAt: sunsetAt || undefined,
    imageFolder: getCell(rawRow, "imageFolder") || path.join("inbox", handle),
    stockPerSize,
    rowHashInput: {},
  }

  row.rowHashInput = {
    handle: row.handle,
    status: row.status,
    title: row.title,
    story: row.story,
    description: row.description,
    feeling: row.feeling,
    subfeeling: row.subfeeling,
    occasions: row.occasions,
    apparelCategory: row.apparelCategory,
    priceEgp: row.priceEgp,
    originalPriceEgp: row.originalPriceEgp,
    sizes: row.sizes,
    garmentColor: row.garmentColor,
    decorationType: row.decorationType,
    fitLabel: row.fitLabel,
    trustBadges: row.trustBadges,
    merchandisingBadge: row.merchandisingBadge,
    stockNote: row.stockNote,
    sizeTableKey: row.sizeTableKey,
    artist: row.artist,
    capsuleSlugs: row.capsuleSlugs,
    complementarySlugs: row.complementarySlugs,
    frequentlyBoughtWithSlugs: row.frequentlyBoughtWithSlugs,
    customersAlsoBoughtSlugs: row.customersAlsoBoughtSlugs,
    launchAt: row.launchAt,
    sunsetAt: row.sunsetAt,
    imageFolder: row.imageFolder,
    stockPerSize: row.stockPerSize,
  }

  if (row.status === "ready") {
    for (const field of ["title", "story", "feeling", "subfeeling"] as const) {
      if (!row[field]) {
        issues.push(createIssue(row, field, `${field} is required when status=ready.`))
      }
    }
    if (row.priceEgp === undefined) {
      issues.push(createIssue(row, "priceEgp", "priceEgp is required when status=ready."))
    }
  }

  for (const field of ["feeling", "subfeeling", "artist"] as const) {
    const value = row[field]
    if (value && !SLUG_RE.test(value)) {
      issues.push(
        createIssue(row, field, `${field} must be a lowercase slug, e.g. mood or nada-ibrahim.`),
      )
    }
  }

  if (row.apparelCategory && !PATH_RE.test(row.apparelCategory)) {
    issues.push(createIssue(row, "apparelCategory", "apparelCategory must be a slash-separated slug path."))
  }

  validateSlugList(issues, row, "occasions", row.occasions)
  validateSlugList(issues, row, "capsuleSlugs", row.capsuleSlugs)
  validateSlugList(issues, row, "complementarySlugs", row.complementarySlugs)
  validateSlugList(issues, row, "frequentlyBoughtWithSlugs", row.frequentlyBoughtWithSlugs)
  validateSlugList(issues, row, "customersAlsoBoughtSlugs", row.customersAlsoBoughtSlugs)

  return { row, issues }
}

export function galleryTagForFilename(filename: string): GalleryTag | undefined {
  const base = path.basename(filename, path.extname(filename)).toLowerCase()
  return TAG_PREFIXES.find(({ prefix }) => base.startsWith(prefix))?.tag
}

function sanitizeGalleryBase(filename: string): string {
  const base = path.basename(filename, path.extname(filename)).toLowerCase()
  const sanitized = base.replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "")
  return sanitized || "image"
}

function allocateTargetFile(base: string, ext: string, used: Set<string>): string {
  let candidate = `${base}${ext}`
  let index = 2
  while (used.has(candidate)) {
    candidate = `${base}-${index}${ext}`
    index++
  }
  used.add(candidate)
  return candidate
}

async function discoverImagePlan(cwd: string, row: CatalogRow): Promise<ImagePlan> {
  const imageFolderRel = row.imageFolder
  const imageFolderAbs = path.resolve(cwd, imageFolderRel)
  const issues: ValidationIssue[] = []

  if (!existsSync(imageFolderAbs)) {
    issues.push(createIssue(row, "imageFolder", `Image folder does not exist: ${imageFolderRel}`))
    return { imageFolderAbs, imageFolderRel, gallery: [], imageStampInput: [], issues }
  }

  const entries = await fs.readdir(imageFolderAbs, { withFileTypes: true })
  const files = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => !name.startsWith("."))
    .sort((a, b) => a.localeCompare(b))

  const supportedImages = files.filter((name) => IMAGE_EXTENSIONS.has(path.extname(name).toLowerCase()))
  const unsupported = files.filter((name) => !IMAGE_EXTENSIONS.has(path.extname(name).toLowerCase()))
  for (const name of unsupported) {
    issues.push(createIssue(row, "imageFolder", `Unsupported image file ignored: ${name}`))
  }

  const imageStampInput = await Promise.all(
    supportedImages.map(async (name) => {
      const stat = await fs.stat(path.join(imageFolderAbs, name))
      return {
        name,
        mtimeMs: Math.round(stat.mtimeMs),
        size: stat.size,
      }
    }),
  )

  const mainFiles = supportedImages.filter((name) => path.basename(name, path.extname(name)).toLowerCase() === "main")
  if (row.status === "ready" && mainFiles.length === 0) {
    issues.push(createIssue(row, "imageFolder", "status=ready requires main.{jpg,png,webp} in the image folder."))
  }
  if (mainFiles.length > 1) {
    issues.push(createIssue(row, "imageFolder", `Multiple main images found: ${mainFiles.join(", ")}.`))
  }

  const mainName = mainFiles[0]
  const main = mainName
    ? {
        sourceAbs: path.join(imageFolderAbs, mainName),
        sourceName: mainName,
        targetFile: `main${path.extname(mainName).toLowerCase()}`,
      }
    : undefined

  const usedGalleryTargets = new Set<string>()
  const tagCounts = new Map<GalleryTag, number>()
  const gallery = supportedImages
    .filter((name) => name !== mainName)
    .map((sourceName) => {
      const ext = path.extname(sourceName).toLowerCase()
      const tag = galleryTagForFilename(sourceName)
      let targetBase: string
      if (tag) {
        const count = (tagCounts.get(tag) ?? 0) + 1
        tagCounts.set(tag, count)
        targetBase = count === 1 ? tag : `${tag}-${count}`
      } else {
        targetBase = sanitizeGalleryBase(sourceName)
      }
      return {
        sourceAbs: path.join(imageFolderAbs, sourceName),
        sourceName,
        targetFile: path.join("gallery", allocateTargetFile(targetBase, ext, usedGalleryTargets)),
        tag,
      }
    })

  return {
    imageFolderAbs,
    imageFolderRel,
    main,
    gallery,
    imageStampInput,
    issues,
  }
}

export async function validateCatalogRows(
  rawRows: RawSheetRow[],
  cwd: string,
): Promise<{ rows: CatalogRow[]; issues: ValidationIssue[]; imagePlans: Map<string, ImagePlan> }> {
  const rows: CatalogRow[] = []
  const issues: ValidationIssue[] = []
  const imagePlans = new Map<string, ImagePlan>()
  const seenHandles = new Map<string, number>()

  for (const rawRow of rawRows) {
    const normalized = normalizeSheetRow(rawRow)
    issues.push(...normalized.issues)
    if (!normalized.row) continue
    rows.push(normalized.row)
    const firstRow = seenHandles.get(normalized.row.handle)
    if (firstRow !== undefined) {
      issues.push(
        createIssue(
          normalized.row,
          "handle",
          `Duplicate handle "${normalized.row.handle}" also appears on row ${firstRow}.`,
        ),
      )
    } else {
      seenHandles.set(normalized.row.handle, normalized.row.rowNumber)
    }
  }

  for (const row of rows) {
    if (row.status !== "ready") continue
    const plan = await discoverImagePlan(cwd, row)
    imagePlans.set(row.handle, plan)
    issues.push(...plan.issues)
  }

  return { rows, issues, imagePlans }
}

function buildDropYaml(row: CatalogRow, imagePlan: ImagePlan): Record<string, unknown> {
  const product: Record<string, unknown> = {
    handle: row.handle,
    title: row.title,
    story: row.story,
  }

  if (row.description) product.description = row.description

  product.feeling = row.feeling
  product.subfeeling = row.subfeeling
  if (row.occasions.length) product.occasions = row.occasions
  if (row.apparelCategory) product.apparelCategory = row.apparelCategory

  product.priceEgp = row.priceEgp
  if (row.originalPriceEgp !== undefined) product.originalPriceEgp = row.originalPriceEgp
  product.sizes = row.sizes
  if (row.garmentColor) product.garmentColor = row.garmentColor

  if (row.artist) product.artist = row.artist
  if (row.decorationType) product.decorationType = row.decorationType
  if (row.fitLabel) product.fitLabel = row.fitLabel
  if (row.trustBadges.length) product.trustBadges = row.trustBadges
  if (row.merchandisingBadge) product.merchandisingBadge = row.merchandisingBadge
  if (row.stockNote) product.stockNote = row.stockNote
  if (row.sizeTableKey) product.sizeTableKey = row.sizeTableKey

  product.mainImage = imagePlan.main?.targetFile
  if (imagePlan.gallery.length) {
    product.gallery = imagePlan.gallery.map((entry) => ({
      file: entry.targetFile,
      ...(entry.tag ? { tag: entry.tag } : {}),
    }))
  }

  if (row.capsuleSlugs.length) product.capsuleSlugs = row.capsuleSlugs
  if (row.complementarySlugs.length) product.complementarySlugs = row.complementarySlugs
  if (row.frequentlyBoughtWithSlugs.length) product.frequentlyBoughtWithSlugs = row.frequentlyBoughtWithSlugs
  if (row.customersAlsoBoughtSlugs.length) product.customersAlsoBoughtSlugs = row.customersAlsoBoughtSlugs
  if (row.launchAt) product.launchAt = row.launchAt
  if (row.sunsetAt) product.sunsetAt = row.sunsetAt

  return product
}

function dumpYaml(value: Record<string, unknown>): string {
  return yaml.dump(value, {
    noRefs: true,
    lineWidth: 100,
    sortKeys: false,
    quotingType: '"',
  })
}

async function readExistingSyncStamp(dropDir: string): Promise<{ hash?: string } | null> {
  const stampPath = path.join(dropDir, SYNC_STAMP_FILE)
  if (!existsSync(stampPath)) return null
  try {
    return JSON.parse(await fs.readFile(stampPath, "utf-8")) as { hash?: string }
  } catch {
    return null
  }
}

async function cleanGeneratedMedia(dropDir: string): Promise<void> {
  const galleryDir = path.join(dropDir, "gallery")
  await fs.rm(galleryDir, { recursive: true, force: true })

  if (!existsSync(dropDir)) return
  const entries = await fs.readdir(dropDir, { withFileTypes: true })
  await Promise.all(
    entries
      .filter((entry) => entry.isFile())
      .filter((entry) => path.basename(entry.name, path.extname(entry.name)).toLowerCase() === "main")
      .filter((entry) => IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
      .map((entry) => fs.rm(path.join(dropDir, entry.name), { force: true })),
  )
}

async function copyImagePlan(dropDir: string, imagePlan: ImagePlan): Promise<void> {
  if (!imagePlan.main) return
  await fs.copyFile(imagePlan.main.sourceAbs, path.join(dropDir, imagePlan.main.targetFile))
  if (imagePlan.gallery.length) {
    await fs.mkdir(path.join(dropDir, "gallery"), { recursive: true })
  }
  for (const entry of imagePlan.gallery) {
    await fs.copyFile(entry.sourceAbs, path.join(dropDir, entry.targetFile))
  }
}

function imageSummary(imagePlan: ImagePlan): string {
  const main = imagePlan.main ? `main=${imagePlan.main.sourceName}` : "main=missing"
  const gallery = imagePlan.gallery.length
    ? `gallery=${imagePlan.gallery.map((entry) => entry.sourceName).join(", ")}`
    : "gallery=none"
  return `${main}; ${gallery}`
}

async function scaffoldOneDrop(
  row: CatalogRow,
  imagePlan: ImagePlan,
  dropsRoot: string,
  options: Pick<CatalogSyncOptions, "force" | "dryRun">,
): Promise<ScaffoldResult> {
  const dropDir = path.join(dropsRoot, row.handle)
  const importedStampPath = path.join(dropDir, IMPORT_STAMP_FILE)
  const importedStampExists = existsSync(importedStampPath)

  try {
    const productYaml = dumpYaml(buildDropYaml(row, imagePlan))
    const hash = sha256(
      canonicalJson({
        row: row.rowHashInput,
        images: imagePlan.imageStampInput,
        productYaml,
      }),
    )

    const existingStamp = await readExistingSyncStamp(dropDir)
    const dropExists = existsSync(dropDir)
    if (!options.force && existingStamp?.hash === hash) {
      return {
        rowNumber: row.rowNumber,
        handle: row.handle,
        status: "unchanged",
        message: "Existing .synced hash matches.",
        dropDir,
        hash,
        importedStampExists,
        imageSummary: imageSummary(imagePlan),
      }
    }

    await fs.mkdir(dropDir, { recursive: true })
    await cleanGeneratedMedia(dropDir)
    await copyImagePlan(dropDir, imagePlan)
    await fs.writeFile(path.join(dropDir, "product.yaml"), productYaml)
    await fs.writeFile(
      path.join(dropDir, SYNC_STAMP_FILE),
      JSON.stringify(
        {
          handle: row.handle,
          hash,
          syncedAt: new Date().toISOString(),
          sheetRow: row.rowNumber,
          imageFolder: imagePlan.imageFolderRel,
          images: imagePlan.imageStampInput,
        },
        null,
        2,
      ),
    )

    if (!options.dryRun) {
      await fs.rm(importedStampPath, { force: true })
    }

    return {
      rowNumber: row.rowNumber,
      handle: row.handle,
      status: dropExists ? "changed" : "added",
      message: dropExists ? "Drop scaffold updated; .imported invalidated." : "Drop scaffold created.",
      dropDir,
      hash,
      importedStampExists,
      imageSummary: imageSummary(imagePlan),
    }
  } catch (error) {
    return {
      rowNumber: row.rowNumber,
      handle: row.handle,
      status: "error",
      message: error instanceof Error ? error.message : String(error),
      dropDir,
      importedStampExists,
      imageSummary: imageSummary(imagePlan),
    }
  }
}

export async function scaffoldCatalogDrops(
  rows: CatalogRow[],
  imagePlans: Map<string, ImagePlan>,
  dropsRoot: string,
  options: Pick<CatalogSyncOptions, "force" | "dryRun">,
): Promise<ScaffoldResult[]> {
  const results: ScaffoldResult[] = []
  for (const row of rows) {
    if (row.status !== "ready") {
      results.push({
        rowNumber: row.rowNumber,
        handle: row.handle,
        status: "skipped",
        message: `status=${row.status}; not scaffolded.`,
        dropDir: path.join(dropsRoot, row.handle),
      })
      continue
    }

    const imagePlan = imagePlans.get(row.handle)
    if (!imagePlan) {
      results.push({
        rowNumber: row.rowNumber,
        handle: row.handle,
        status: "error",
        message: "Missing image plan.",
        dropDir: path.join(dropsRoot, row.handle),
      })
      continue
    }
    results.push(await scaffoldOneDrop(row, imagePlan, dropsRoot, options))
  }
  return results
}

async function fetchCatalogCsv(source: string, cwd: string): Promise<string> {
  if (isHttpUrl(source)) {
    const response = await fetch(source)
    if (!response.ok) {
      throw new Error(`Failed to fetch catalog sheet CSV (${response.status} ${response.statusText}).`)
    }
    return response.text()
  }

  const filePath = path.isAbsolute(source) ? source : path.resolve(cwd, source)
  return fs.readFile(filePath, "utf-8")
}

function filterRowsByOnly(rows: RawSheetRow[], onlyHandles?: Set<string>): RawSheetRow[] {
  if (!onlyHandles?.size) return rows
  return rows.filter((row) => onlyHandles.has(getCell(row, "handle")))
}

function stockMapFromRows(rows: CatalogRow[]): StockMap {
  return rows.reduce<StockMap>((acc, row) => {
    if (row.status === "ready" && row.stockPerSize) {
      acc[row.handle] = row.stockPerSize
    }
    return acc
  }, {})
}

export function buildMarkdownReport(report: CatalogSyncReport): string {
  const lines: string[] = []
  const scaffoldCounts = report.scaffoldResults.reduce<Record<string, number>>((acc, result) => {
    acc[result.status] = (acc[result.status] ?? 0) + 1
    return acc
  }, {})

  lines.push("# Catalog Sync Report")
  lines.push("")
  lines.push(`- Source: ${report.csvSource}`)
  lines.push(`- Mode: ${report.dryRun ? "dry-run" : "write"}`)
  if (report.tempDir) lines.push(`- Dry-run output: ${report.tempDir}`)
  if (report.scopedHandles.length) lines.push(`- Scope: ${report.scopedHandles.join(", ")}`)
  lines.push("")
  lines.push("## Summary")
  lines.push("")
  lines.push("| Metric | Count |")
  lines.push("| --- | ---: |")
  lines.push(`| Fetched rows | ${report.fetchedRows} |`)
  lines.push(`| Selected rows | ${report.selectedRows} |`)
  lines.push(`| Ready rows | ${report.readyRows} |`)
  lines.push(`| Draft rows | ${report.draftRows} |`)
  lines.push(`| Archived rows | ${report.archivedRows} |`)
  lines.push(`| Validation errors | ${report.validationIssues.length} |`)
  lines.push(`| Scaffolds added | ${scaffoldCounts.added ?? 0} |`)
  lines.push(`| Scaffolds changed | ${scaffoldCounts.changed ?? 0} |`)
  lines.push(`| Scaffolds unchanged | ${scaffoldCounts.unchanged ?? 0} |`)
  lines.push(`| Scaffold errors | ${scaffoldCounts.error ?? 0} |`)
  lines.push(`| Import handles | ${report.importHandles.length} |`)
  lines.push(`| Stock-map handles | ${Object.keys(report.stockMap).length} |`)
  lines.push("")

  lines.push("## Validation")
  lines.push("")
  if (!report.validationIssues.length) {
    lines.push("No validation errors.")
  } else {
    lines.push("| Row | Handle | Field | Error |")
    lines.push("| ---: | --- | --- | --- |")
    for (const issue of report.validationIssues) {
      lines.push(`| ${issue.rowNumber} | ${issue.handle ?? ""} | ${issue.field} | ${issue.message} |`)
    }
  }
  lines.push("")

  lines.push("## Scaffold")
  lines.push("")
  if (!report.scaffoldResults.length) {
    lines.push("No ready rows were scaffolded.")
  } else {
    lines.push("| Row | Handle | Result | Images | Message |")
    lines.push("| ---: | --- | --- | --- | --- |")
    for (const result of report.scaffoldResults) {
      lines.push(
        `| ${result.rowNumber} | ${result.handle} | ${result.status} | ${result.imageSummary ?? ""} | ${result.message} |`,
      )
    }
  }
  lines.push("")

  lines.push("## Medusa Stages")
  lines.push("")
  lines.push(`- Import: ${report.dryRun ? "skipped for dry-run" : report.importHandles.join(", ") || "no-op"}`)
  lines.push(
    `- Stock: ${
      report.dryRun
        ? "skipped for dry-run"
        : Object.keys(report.stockMap).length
          ? Object.keys(report.stockMap).join(", ")
          : "no-op"
    }`,
  )
  lines.push(`- Inventory: ${report.dryRun ? "skipped for dry-run" : "completed unless listed below"}`)
  lines.push("")

  if (report.stageErrors.length) {
    lines.push("## Stage Errors")
    lines.push("")
    for (const error of report.stageErrors) {
      lines.push(`- ${error}`)
    }
    lines.push("")
  }

  return `${lines.join("\n")}\n`
}

async function writeReport(reportPath: string | undefined, report: CatalogSyncReport, cwd: string): Promise<void> {
  if (!reportPath) return
  const absolutePath = path.isAbsolute(reportPath) ? reportPath : path.resolve(cwd, reportPath)
  await fs.mkdir(path.dirname(absolutePath), { recursive: true })
  await fs.writeFile(absolutePath, buildMarkdownReport(report))
}

export async function runCatalogSync({
  container,
  cwd = process.cwd(),
  env = process.env,
  options,
}: {
  container?: ExecArgs["container"]
  cwd?: string
  env?: NodeJS.ProcessEnv
  options: CatalogSyncOptions
}): Promise<CatalogSyncReport> {
  const csvSource = options.csvSource ?? env.CATALOG_SHEET_CSV_URL
  if (!csvSource) {
    throw new Error("CATALOG_SHEET_CSV_URL is required, or pass --csv=path-or-url.")
  }

  const csv = await fetchCatalogCsv(csvSource, cwd)
  const fetchedRows = parseSheetRows(csv)
  const selectedRawRows = filterRowsByOnly(fetchedRows, options.onlyHandles)
  const scopedHandles = [...(options.onlyHandles ?? new Set<string>())]
  const missingOnlyHandles = scopedHandles.filter(
    (handle) => !fetchedRows.some((row) => getCell(row, "handle") === handle),
  )

  const { rows, issues, imagePlans } = await validateCatalogRows(selectedRawRows, cwd)
  for (const handle of missingOnlyHandles) {
    issues.push({
      rowNumber: 0,
      handle,
      field: "only",
      message: `--only handle "${handle}" was not found in the sheet.`,
    })
  }

  const errorsByHandle = new Map<string, number>()
  for (const issue of issues) {
    if (!issue.handle) continue
    errorsByHandle.set(issue.handle, (errorsByHandle.get(issue.handle) ?? 0) + 1)
  }

  const readyRows = rows.filter((row) => row.status === "ready")
  const validRows = rows.filter((row) => !errorsByHandle.has(row.handle))
  const validReadyRows = readyRows.filter((row) => !errorsByHandle.has(row.handle))
  const dropsRootBase = options.dryRun ? await fs.mkdtemp(path.join(os.tmpdir(), "horo-catalog-sync-")) : cwd
  const dropsRoot = path.join(dropsRootBase, "drops")
  const scaffoldResults = await scaffoldCatalogDrops(validRows, imagePlans, dropsRoot, {
    dryRun: options.dryRun,
    force: options.force,
  })

  const importHandles = scaffoldResults
    .filter((result) => result.status === "added" || result.status === "changed" || result.status === "unchanged")
    .filter((result) => {
      if (options.force) return true
      if (result.status === "added" || result.status === "changed") return true
      return result.status === "unchanged" && !result.importedStampExists
    })
    .map((result) => result.handle)

  const validRowsByHandle = new Map(validReadyRows.map((row) => [row.handle, row]))
  const stockMap = stockMapFromRows(importHandles.map((handle) => validRowsByHandle.get(handle)).filter(Boolean) as CatalogRow[])
  const stageErrors: string[] = []

  if (!options.dryRun && importHandles.length) {
    if (!container) {
      stageErrors.push("Import skipped: Medusa container is not available.")
    } else {
      try {
        const { default: importProductDrops } = await import("./import-product-drops.js") as unknown as {
          default: (args: ExecArgs) => Promise<void>
        }
        await importProductDrops({
          container,
          args: [`--only=${importHandles.join(",")}`, ...(options.force ? ["--force"] : [])],
        } as ExecArgs)
      } catch (error) {
        stageErrors.push(`Import stage failed: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  }

  if (!options.dryRun && !options.noStock && Object.keys(stockMap).length) {
    if (!container) {
      stageErrors.push("Stock skipped: Medusa container is not available.")
    } else {
      try {
        const { runEnableVariantStockTracking } = await import("./enable-variant-stock-tracking.js")
        await runEnableVariantStockTracking(container, {
          defaultQty: 50,
          dryRun: false,
          stockMap,
        })
      } catch (error) {
        stageErrors.push(`Stock stage failed: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  }

  if (!options.dryRun && !options.noInventory && Object.keys(stockMap).length) {
    if (!container) {
      stageErrors.push("Inventory skipped: Medusa container is not available.")
    } else {
      try {
        const { runBackfillInventoryLevels } = await import("./backfill-inventory-levels.js")
        await runBackfillInventoryLevels(container, {
          defaultQty: 50,
          dryRun: false,
          stockMap,
        })
      } catch (error) {
        stageErrors.push(`Inventory stage failed: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  }

  return {
    csvSource,
    dryRun: options.dryRun,
    scopedHandles,
    tempDir: options.dryRun ? dropsRootBase : undefined,
    fetchedRows: fetchedRows.length,
    selectedRows: selectedRawRows.length,
    readyRows: readyRows.length,
    draftRows: rows.filter((row) => row.status === "draft").length,
    archivedRows: rows.filter((row) => row.status === "archived").length,
    validationIssues: issues,
    scaffoldResults,
    importHandles,
    stockMap,
    stageErrors,
  }
}

export default async function syncCatalogFromSheet({ container, args }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const options = parseCatalogSyncArgs([...normalizeArgList(args), ...process.argv])

  const report = await runCatalogSync({ container, options })
  await writeReport(options.reportPath, report, process.cwd())

  logger.info(
    `catalog:sync rows=${report.selectedRows}, ready=${report.readyRows}, validation-errors=${report.validationIssues.length}, import=${report.importHandles.length}`,
  )

  if (options.reportPath) {
    logger.info(`catalog:sync report written to ${options.reportPath}`)
  }

  if (!options.allowPartial && (report.validationIssues.length > 0 || report.stageErrors.length > 0)) {
    process.exitCode = 1
  }
}
