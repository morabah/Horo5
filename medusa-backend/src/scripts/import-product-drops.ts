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
import { ContainerRegistrationKeys, Modules, ProductStatus } from "@medusajs/framework/utils"
import {
  batchLinkProductsToCategoryWorkflow,
  createProductsWorkflow,
  updateProductsWorkflow,
} from "@medusajs/medusa/core-flows"
import { uploadFilesWorkflow } from "@medusajs/core-flows"

import { ARTIST_MODULE } from "../modules/artist"
import type ArtistModuleService from "../modules/artist/service"
import { OCCASION_MODULE } from "../modules/occasion"
import type OccasionModuleService from "../modules/occasion/service"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ProductSizeKey = "S" | "M" | "L" | "XL" | "XXL"

type GalleryEntry = {
  file: string
  tag?: "proof_fabric" | "proof_print" | "proof_wash" | "lifestyle" | "flat_lay"
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

const DEFAULT_SIZES: readonly ProductSizeKey[] = ["S", "M", "L", "XL", "XXL"]
const DEFAULT_TRUST_BADGES = ["premium cotton", "Free exchange 14d", "COD available"]
const DROPS_DIR = "drops"
const STAMP_FILE = ".imported"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toMimeType(filePath: string): string {
  if (filePath.endsWith(".png")) return "image/png"
  if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) return "image/jpeg"
  if (filePath.endsWith(".webp")) return "image/webp"
  if (filePath.endsWith(".svg")) return "image/svg+xml"
  return "application/octet-stream"
}

async function uploadImage(container: ExecArgs["container"], imagePath: string) {
  const absolutePath = path.resolve(process.cwd(), imagePath)
  const content = await fs.readFile(absolutePath)
  const filename = path.basename(absolutePath)

  const { result } = await uploadFilesWorkflow(container).run({
    input: {
      files: [
        {
          filename,
          mimeType: toMimeType(filename),
          content: content.toString("base64"),
          access: "public",
        },
      ],
    },
  })

  return result[0]?.url
}

function isForceMode(): boolean {
  return (process.argv.includes("--force") || process.env.DROP_FORCE === "1")
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
// Category resolution
// ---------------------------------------------------------------------------

type CategoryRow = { id: string; handle: string; parent_category_id?: string | null }

async function resolveCategoryByPath(
  query: any,
  categoryPath: string
): Promise<string | null> {
  // categoryPath like "apparel/tops/t-shirts" → find the leaf category
  const handles = categoryPath.split("/")
  const leafHandle = handles[handles.length - 1]

  const { data: rows } = await (query as any).graph({
    entity: "product_category",
    fields: ["id", "handle"],
    filters: { handle: leafHandle },
  })

  const match = (rows as CategoryRow[] | undefined)?.[0]
  return match?.id ?? null
}

async function resolveFeelingCategory(
  query: any,
  feelingSlug: string,
  subfeelingSlug: string
): Promise<string | null> {
  // Try subfeeling first (leaf), then feeling
  for (const handle of [subfeelingSlug, feelingSlug]) {
    const { data: rows } = await query.graph({
      entity: "product_category",
      fields: ["id", "handle", "parent_category_id"],
      filters: { handle },
    })
    const match = (rows as CategoryRow[] | undefined)?.[0]
    if (match) return match.id
  }
  return null
}

// ---------------------------------------------------------------------------
// Main importer
// ---------------------------------------------------------------------------

export default async function importProductDrops({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const force = isForceMode()
  const dropDirs = await discoverDrops()

  if (!dropDirs.length) {
    logger.info("No product drops found in drops/ directory.")
    return
  }

  const pending = force ? dropDirs : dropDirs.filter((d) => !isAlreadyImported(d))

  if (!pending.length) {
    logger.info("All drops already imported. Use --force to re-import.")
    return
  }

  logger.info(`Found ${pending.length} pending drop(s) out of ${dropDirs.length} total.`)

  // Resolve sales channel once
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL)
  const defaultSalesChannel = await salesChannelModuleService.listSalesChannels({
    name: "Default Sales Channel",
  })
  const salesChannelId = defaultSalesChannel[0]?.id

  if (!salesChannelId) {
    throw new Error("No Default Sales Channel found. Run seed-egypt-catalog first.")
  }

  // Resolve Egypt region for pricing
  const { data: regionRows } = await query.graph({
    entity: "region",
    fields: ["id", "currency_code"],
    filters: { currency_code: "egp" },
  })
  const egyptRegionId = (regionRows as Array<{ id: string }>)?.[0]?.id

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

      const galleryImages: Array<{ url: string; tag?: string }> = []
      for (const entry of drop.gallery ?? []) {
        const url = await uploadImage(container, path.join(dropDir, entry.file))
        if (url) {
          galleryImages.push({ url, tag: entry.tag })
        }
      }

      const allImageUrls = [mainImageUrl, ...galleryImages.map((g) => g.url)]
      const uniqueImageUrls = [...new Set(allImageUrls)]

      // --- Resolve artist ---
      let artistMeta: { name: string; avatarUrl?: string } | undefined
      if (drop.artist) {
        const artistModuleService = container.resolve<ArtistModuleService>(ARTIST_MODULE)
        const existing = await artistModuleService.listArtists({ slug: [drop.artist] }) as Array<{
          id: string
          slug: string
          name: string
          avatar_src?: string | null
        }>

        if (existing.length) {
          const artist = existing[0]
          artistMeta = { name: artist.name }
          if (artist.avatar_src) artistMeta.avatarUrl = artist.avatar_src
        } else {
          // Create placeholder artist
          const name = drop.artist
            .split("-")
            .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
            .join(" ")
          await artistModuleService.createArtists({
            active: true,
            name,
            slug: drop.artist,
            style: "TBD",
            design_count: 1,
            avatar_src: "",
          })
          artistMeta = { name }
        }
      }

      // --- Resolve occasions ---
      if (drop.occasions?.length) {
        const occasionModuleService = container.resolve<OccasionModuleService>(OCCASION_MODULE)
        for (const occasionSlug of drop.occasions) {
          const existing = await occasionModuleService.listOccasions({ slug: occasionSlug }) as Array<{ id: string }>
          if (!existing.length) {
            await occasionModuleService.createOccasions({
              active: true,
              name: occasionSlug.split("-").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" "),
              slug: occasionSlug,
              sort_order: 0,
            })
          }
        }
      }

      // --- Build metadata ---
      const sizes = drop.sizes ?? [...DEFAULT_SIZES]
      const media = {
        main: mainImageUrl,
        gallery: galleryImages.map((g) => ({ url: g.url, tag: g.tag })),
      }

      const metadata: Record<string, unknown> = {
        apparelCategoryPath: drop.apparelCategory ?? "apparel/tops/t-shirts",
        artistSlug: drop.artist ?? "",
        ...(artistMeta ? { artist: artistMeta } : {}),
        artworkSlug: drop.handle,
        availableSizes: sizes,
        capsuleSlugs: drop.capsuleSlugs ?? [],
        catalogOrder: 0,
        complementarySlugs: drop.complementarySlugs ?? [],
        customersAlsoBoughtSlugs: drop.customersAlsoBoughtSlugs ?? [],
        decorationType: drop.decorationType ?? "graphic",
        feelingSlug: drop.feeling,
        fitLabel: drop.fitLabel,
        frequentlyBoughtWithSlugs: drop.frequentlyBoughtWithSlugs ?? [],
        garmentColors: drop.garmentColor ? [drop.garmentColor] : [],
        media,
        merchandisingBadge: drop.merchandisingBadge,
        occasionSlugs: drop.occasions ?? [],
        primaryOccasionSlug: drop.occasions?.[0] ?? null,
        priceEgp: drop.priceEgp,
        sizeTableKey: drop.sizeTableKey,
        stockNote: drop.stockNote,
        story: drop.story,
        trustBadges: drop.trustBadges ?? [...DEFAULT_TRUST_BADGES],
        ...(drop.launchAt ? { launchAt: drop.launchAt } : {}),
        ...(drop.sunsetAt ? { sunsetAt: drop.sunsetAt } : {}),
        ...(drop.originalPriceEgp ? { originalPriceEgp: drop.originalPriceEgp } : {}),
      }

      // --- Check if product already exists ---
      const { data: existingProducts } = await query.graph({
        entity: "product",
        fields: ["id", "handle"],
        filters: { handle: drop.handle },
      })
      const existingProduct = (existingProducts as Array<{ id: string; handle: string }>)?.[0]

      if (existingProduct) {
        // Update existing product
        await updateProductsWorkflow(container).run({
          input: {
            selector: { id: existingProduct.id },
            update: {
              title: drop.title,
              description: drop.description ?? drop.story,
              metadata,
              images: uniqueImageUrls.map((url) => ({ url })),
              thumbnail: mainImageUrl,
            },
          },
        })
        logger.info(`  Updated existing product: ${drop.handle} (${existingProduct.id})`)
      } else {
        // Create new product
        await createProductsWorkflow(container).run({
          input: {
            products: [
              {
                title: drop.title,
                handle: drop.handle,
                description: drop.description ?? drop.story,
                status: ProductStatus.PUBLISHED,
                metadata,
                images: uniqueImageUrls.map((url) => ({ url })),
                thumbnail: mainImageUrl,
                options: [{ title: "Size", values: [...sizes] }],
                variants: sizes.map((size) => ({
                  title: size,
                  sku: `${drop.handle.toUpperCase()}-${size}`,
                  options: { Size: size },
                  manage_inventory: false,
                  allow_backorder: true,
                  prices: [{ amount: drop.priceEgp, currency_code: "egp" }],
                })),
                sales_channels: [{ id: salesChannelId }],
              },
            ],
          },
        })
        logger.info(`  Created new product: ${drop.handle}`)
      }

      // --- Link to apparel category ---
      if (drop.apparelCategory) {
        const categoryId = await resolveCategoryByPath(query, drop.apparelCategory)
        if (categoryId) {
          const { data: productRows } = await query.graph({
            entity: "product",
            fields: ["id"],
            filters: { handle: drop.handle },
          })
          const productId = (productRows as Array<{ id: string }>)?.[0]?.id
          if (productId) {
            await batchLinkProductsToCategoryWorkflow(container).run({
              input: { id: categoryId, add: [productId], remove: [] },
            })
          }
        }
      }

      // --- Link to feeling category ---
      const feelingCategoryId = await resolveFeelingCategory(query, drop.feeling, drop.subfeeling)
      if (feelingCategoryId) {
        const { data: productRows } = await query.graph({
          entity: "product",
          fields: ["id"],
          filters: { handle: drop.handle },
        })
        const productId = (productRows as Array<{ id: string }>)?.[0]?.id
        if (productId) {
          await batchLinkProductsToCategoryWorkflow(container).run({
            input: { id: feelingCategoryId, add: [productId], remove: [] },
          })
        }
      }

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
