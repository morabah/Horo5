// Product Drop Importer
//
// Reads drops/*/product.yaml + co-located images, creates/updates products
// in Medusa with full PDP metadata, category linking, and image uploads.
//
// Usage:
//   medusa exec ./src/scripts/import-product-drops.ts
//   npm run import:drops
//   npm run import:drops -- --force   (re-import already-processed drops)
//
// Idempotent: a .imported stamp file is written next to each product.yaml
// after successful import. Re-runs skip processed drops unless --force.
import fs from "node:fs/promises"
import { existsSync } from "node:fs"
import path from "node:path"
import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { uploadDropFiles, dropMimeType } from "../lib/drops/upload"
import { upsertDrop } from "../lib/drops/upsert-drop"
import type { DropImageTag, ProductSizeKey, UpsertDropPayload } from "../lib/drops/types"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type GalleryEntry = {
  file: string
  tag?: Exclude<DropImageTag, "main">
}

type DropYaml = {
  handle: string
  title: string
  story: string
  description?: string
  feeling: string
  subfeeling: string
  occasions?: string[]
  apparelCategory?: string
  priceEgp: number
  originalPriceEgp?: number | null
  sizes?: ProductSizeKey[]
  garmentColor?: string
  artist?: string
  decorationType?: "plain" | "graphic" | "embroidered" | "mixed"
  fitLabel?: string
  trustBadges?: string[]
  merchandisingBadge?: string
  stockNote?: string
  sizeTableKey?: string
  mainImage: string
  gallery?: GalleryEntry[]
  capsuleSlugs?: string[]
  complementarySlugs?: string[]
  frequentlyBoughtWithSlugs?: string[]
  customersAlsoBoughtSlugs?: string[]
  launchAt?: string
  sunsetAt?: string
}

const DROPS_DIR = "drops"
const STAMP_FILE = ".imported"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function uploadImage(container: ExecArgs["container"], imagePath: string) {
  const absolutePath = path.resolve(process.cwd(), imagePath)
  const content = await fs.readFile(absolutePath)
  const filename = path.basename(absolutePath)

  const result = await uploadDropFiles(container, [{
    filename,
    mimeType: dropMimeType(filename),
    content: content.toString("base64"),
  }])

  return result[0]?.url
}

function normalizeArgs(args?: unknown): string[] {
  return [
    ...(Array.isArray(args) ? args : []),
    ...process.argv,
  ].filter((arg): arg is string => typeof arg === "string" && arg !== "--")
}

function readOption(args: string[], name: string): string | undefined {
  const prefix = `${name}=`
  const inline = args.find((arg) => arg.startsWith(prefix))
  if (inline) return inline.slice(prefix.length)

  const index = args.indexOf(name)
  if (index >= 0) return args[index + 1]
  return undefined
}

function isForceMode(args?: unknown): boolean {
  const arr = normalizeArgs(args)
  return (arr.includes("--force") || process.env.DROP_FORCE === "1")
}

function parseOnlyHandles(args?: unknown): Set<string> | undefined {
  const only = readOption(normalizeArgs(args), "--only")
  if (!only) return undefined

  const handles = only
    .split(",")
    .map((handle) => handle.trim())
    .filter(Boolean)

  return handles.length ? new Set(handles) : undefined
}

/* Discover drop directories: any folder under drops/ containing product.yaml */
async function discoverDrops(): Promise<string[]> {
  if (!existsSync(DROPS_DIR)) return []

  const entries = await fs.readdir(DROPS_DIR, { withFileTypes: true })
  const drops: string[] = []

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const yamlPath = path.join(DROPS_DIR, entry.name, "product.yaml")
    if (existsSync(yamlPath)) {
      drops.push(path.join(DROPS_DIR, entry.name))
    }
  }

  return drops
}

function isAlreadyImported(dropDir: string): boolean {
  return existsSync(path.join(dropDir, STAMP_FILE))
}

async function markImported(dropDir: string): Promise<void> {
  const stamp = {
    importedAt: new Date().toISOString(),
    handle: path.basename(dropDir),
  }
  await fs.writeFile(path.join(dropDir, STAMP_FILE), JSON.stringify(stamp, null, 2))
}

async function readDrop(dropDir: string): Promise<DropYaml> {
  const yamlPath = path.join(dropDir, "product.yaml")
  const raw = await fs.readFile(yamlPath, "utf-8")
  const jsYaml = await import("js-yaml")
  const parsed = jsYaml.load(raw) as DropYaml

  if (!parsed.handle || !parsed.title || !parsed.story || !parsed.priceEgp) {
    throw new Error(`Invalid product.yaml in ${dropDir}: missing required fields (handle, title, story, priceEgp)`)
  }

  return parsed
}

/* Validate that referenced image files exist. */
async function validateImages(dropDir: string, drop: DropYaml): Promise<void> {
  const mainPath = path.join(dropDir, drop.mainImage)
  if (!existsSync(mainPath)) {
    throw new Error(`Missing mainImage: ${mainPath}`)
  }

  for (const entry of drop.gallery ?? []) {
    const galleryPath = path.join(dropDir, entry.file)
    if (!existsSync(galleryPath)) {
      throw new Error(`Missing gallery image: ${galleryPath}`)
    }
  }
}

// ---------------------------------------------------------------------------
// Main importer
// ---------------------------------------------------------------------------

export default async function importProductDrops({ container, args }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  const force = isForceMode(args)
  const onlyHandles = parseOnlyHandles(args)
  const allDropDirs = await discoverDrops()
  const dropDirs = onlyHandles?.size
    ? allDropDirs.filter((dropDir) => onlyHandles.has(path.basename(dropDir)))
    : allDropDirs

  if (!dropDirs.length) {
    logger.info(onlyHandles?.size
      ? `No matching product drops found for --only=${[...onlyHandles].join(",")}.`
      : "No product drops found in drops/ directory.")
    return
  }

  const pending = force ? dropDirs : dropDirs.filter((d) => !isAlreadyImported(d))

  if (!pending.length) {
    logger.info("All drops already imported. Use --force to re-import.")
    return
  }

  logger.info(`Found ${pending.length} pending drop(s) out of ${dropDirs.length} total.`)

  // Process each drop
  for (const dropDir of pending) {
    const dropName = path.basename(dropDir)
    logger.info(`Importing drop: ${dropName}`)

    try {
      const drop = await readDrop(dropDir)
      await validateImages(dropDir, drop)

      // --- Upload images ---
      const mainImageUrl = await uploadImage(container, path.join(dropDir, drop.mainImage))
      if (!mainImageUrl) {
        throw new Error(`Failed to upload main image for ${dropName}`)
      }

      const galleryImages: Array<{ url: string; tag?: Exclude<DropImageTag, "main"> }> = []
      for (const entry of drop.gallery ?? []) {
        const url = await uploadImage(container, path.join(dropDir, entry.file))
        if (url) {
          galleryImages.push({ url, tag: entry.tag })
        }
      }

      const allImageUrls = [mainImageUrl, ...galleryImages.map((g) => g.url)]
      const uniqueImageUrls = [...new Set(allImageUrls)]
      const payload: UpsertDropPayload = {
        ...drop,
        status: "published",
        images: [
          { url: mainImageUrl, filename: drop.mainImage, tag: "main", order: 0 },
          ...galleryImages.map((image, index) => ({
            url: image.url,
            filename: drop.gallery?.[index]?.file,
            tag: image.tag,
            order: index + 1,
          })),
        ],
      }

      const result = await upsertDrop(container, payload)
      logger.info(`  ${result.created ? "Created" : "Updated"} product: ${drop.handle} (${result.id})`)
      logger.info(`  Uploaded ${uniqueImageUrls.length} image(s).`)

      // --- Mark as imported ---
      await markImported(dropDir)
      logger.info(`  ✓ Drop ${dropName} imported successfully.`)

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      logger.info(`  ✗ Drop ${dropName} FAILED: ${message}`)
      // Continue with next drop
    }
  }

  logger.info("Product drop import completed.")
}
