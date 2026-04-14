import fs from "node:fs/promises"
import { existsSync } from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"

import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules, ProductStatus } from "@medusajs/framework/utils"
import {
  batchLinkProductsToCategoryWorkflow,
  createApiKeysWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  updateProductCategoriesWorkflow,
  updateRegionsWorkflow,
  updateProductsWorkflow,
  updateStoresStep,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows"
import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { uploadFilesWorkflow } from "@medusajs/core-flows"

import type { ApiKey } from "../../.medusa/types/query-entry-points"
import {
  derivePrimarySubfeelingSlugFromLegacyProduct,
  normalizeLegacyWebFeelingSlug,
} from "../lib/storefront/legacy-compat"
import { FEELINGS_ROOT_HANDLE } from "../lib/storefront/feeling-category-metadata"
import { ARTIST_MODULE } from "../modules/artist"
import type ArtistModuleService from "../modules/artist/service"
import {
  FEELING_TAXONOMY,
  type FeelingTaxonomySeed,
  SUBFEELING_TAXONOMY,
  type SubfeelingTaxonomySeed,
} from "./data/feelings-taxonomy-data"
import { egyptProducts, EGYPT_PRODUCT_PRICE_EGP } from "./data/egypt-products"
import { getLegacyProductMedia } from "./data/legacy-product-media"
import { EGYPT_REGION_NAME, getEgyptRegionPaymentProviders } from "./lib/egypt-checkout"
import { merchEvents } from "./data/merch-events"
import { MERCH_EVENT_MODULE } from "../modules/merch-event"
import type MerchEventModuleService from "../modules/merch-event/service"
import { OCCASION_MODULE } from "../modules/occasion"
import type OccasionModuleService from "../modules/occasion/service"
type ProductSizeKey = "S" | "M" | "L" | "XL" | "XXL"

type ProductMedia = {
  gallery: string[]
  main: string
}

type LegacyOccasion = {
  blurb: string
  cardImageAlt: string
  cardImageSrc: string
  heroImageAlt: string
  heroImageSrc: string
  isGiftOccasion: boolean
  name: string
  priceHint?: string
  slug: string
}

type LegacyProduct = {
  artistSlug: string
  availableSizes?: ProductSizeKey[]
  capsuleSlugs?: string[]
  complementarySlugs?: string[]
  customersAlsoBoughtSlugs?: string[]
  feelingSlug: string
  fitLabel?: string
  frequentlyBoughtWithSlugs?: string[]
  garmentColors?: readonly string[]
  inventoryHintBySize?: Partial<Record<ProductSizeKey, string>>
  merchandisingBadge?: string
  name: string
  occasionSlugs: string[]
  pdpFitModels?: unknown[]
  priceEgp: number
  slug: string
  stockNote?: string
  story: string
  trustBadges?: readonly string[]
  useCase?: string
  wearerStories?: unknown[]
}

const DEFAULT_PRODUCT_TRUST_BADGES = [
  "220 GSM cotton",
  "Free exchange 14d",
  "COD available",
] as const

/** Canonical feeling slugs for Egypt hero tees (aligned with migrate-feelings hero fallbacks). */
const EGYPT_HERO_FEELING_BY_HANDLE: Record<string, string> = {
  "horo-emotions-vibe": "mood",
  "horo-zodiac-vibe": "zodiac",
  "horo-fiction-vibe": "fiction",
  "horo-career-vibe": "career",
  "horo-signature-hero": "mood",
}

function buildEgyptHeroLegacyProducts(): LegacyProduct[] {
  const priceEgp = Math.round(EGYPT_PRODUCT_PRICE_EGP / 100)
  return egyptProducts.map((row) => ({
    artistSlug: "nada-ibrahim",
    feelingSlug: EGYPT_HERO_FEELING_BY_HANDLE[row.handle] ?? "mood",
    name: row.titleEn,
    occasionSlugs: [],
    priceEgp,
    slug: row.handle,
    story: row.descriptionEn,
  }))
}

function resolveRepoFile(...candidates: string[]) {
  const resolved = candidates
    .map((candidate) => path.resolve(process.cwd(), candidate))
    .find((candidate) => existsSync(candidate))

  if (!resolved) {
    throw new Error(`Unable to resolve repo file from candidates: ${candidates.join(", ")}`)
  }

  return resolved
}

async function loadLegacyCatalogPayload(): Promise<{
  legacyOccasions: LegacyOccasion[]
  legacyProducts: LegacyProduct[]
}> {
  const fixturesModuleUrl = pathToFileURL(
    resolveRepoFile("../web-next/src/storefront/data/dev-fixtures.ts", "web-next/src/storefront/data/dev-fixtures.ts")
  ).href

  const fixturesModule = (await import(fixturesModuleUrl)) as {
    OCCASION_FIXTURES: LegacyOccasion[]
    products: LegacyProduct[]
  }

  return {
    legacyOccasions: fixturesModule.OCCASION_FIXTURES,
    legacyProducts: fixturesModule.products,
  }
}

const updateStoreCurrencies = createWorkflow(
  "update-store-currencies-egypt",
  (input: {
    supported_currencies: { currency_code: string; is_default?: boolean }[]
    store_id: string
  }) => {
    const normalizedInput = transform({ input }, (data) => {
      return {
        selector: { id: data.input.store_id },
        update: {
          supported_currencies: data.input.supported_currencies.map((currency) => {
            return {
              currency_code: currency.currency_code,
              is_default: currency.is_default ?? false,
            }
          }),
        },
      }
    })

    const stores = updateStoresStep(normalizedInput)
    return new WorkflowResponse(stores)
  }
)

function toMimeType(filePath: string): string {
  if (filePath.endsWith(".png")) return "image/png"
  if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) return "image/jpeg"
  if (filePath.endsWith(".webp")) return "image/webp"
  if (filePath.endsWith(".svg")) return "image/svg+xml"
  return "application/octet-stream"
}

/** When true, seed always re-uploads assets (old behavior). Default false avoids duplicate static/ files. */
function isSeedForceRefreshMedia(): boolean {
  const v = String(process.env.SEED_FORCE_REFRESH_MEDIA || "").trim().toLowerCase()
  return v === "1" || v === "true" || v === "yes"
}

function feelingCardHeroFromCategoryMetadata(metadata: unknown): { card: string; hero: string } | null {
  if (!metadata || typeof metadata !== "object") {
    return null
  }
  const m = metadata as Record<string, unknown>
  const card = m.card_image_src
  const hero = m.hero_image_src
  if (typeof card === "string" && card.length > 0 && typeof hero === "string" && hero.length > 0) {
    return { card, hero }
  }
  return null
}

type ExistingProductSeedRow = {
  id: string
  handle: string
  thumbnail?: string | null
  images?: Array<{ url?: string | null }> | null
  metadata?: Record<string, unknown> | null
}

function productMediaFromExistingRow(row: ExistingProductSeedRow): ProductMedia | null {
  const meta = row.metadata
  const media = meta?.media as { main?: unknown; gallery?: unknown } | undefined
  if (media && typeof media.main === "string" && media.main.length > 0) {
    const galleryRaw = Array.isArray(media.gallery) ? media.gallery : []
    const gallery = galleryRaw.filter((u): u is string => typeof u === "string" && u.length > 0)
    return { main: media.main, gallery }
  }
  const main = row.thumbnail
  if (typeof main === "string" && main.length > 0) {
    const fromImages = (row.images || [])
      .map((i) => i?.url)
      .filter((u): u is string => typeof u === "string" && u.length > 0)
    const gallery = fromImages.filter((u) => u !== main)
    return { main, gallery }
  }
  return null
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

const DEFAULT_SIZES = ["S", "M", "L", "XL", "XXL"] as const satisfies readonly ProductSizeKey[]

function resolveStorefrontPublicAsset(src: string) {
  if (!src.startsWith("/")) {
    return src
  }

  return `../web-next/public${src}`
}

const ARTIST_SEED = [
  {
    avatarSrc: "/images/tees/bg_vibe_emotions.png",
    name: "Nada Ibrahim",
    slug: "nada-ibrahim",
    style: "Bold linework with emotional depth.",
  },
  {
    avatarSrc: "/images/tees/bg_tee_man_casual.png",
    name: "Omar Hassan",
    slug: "omar-hassan",
    style: "Surreal scenes blending Egyptian motifs.",
  },
  {
    avatarSrc: "/images/tees/bg_vibe_fictious.png",
    name: "Layla Farid",
    slug: "layla-farid",
    style: "Soft gradients and cosmic symbolism.",
  },
] as const

const PARENT_APPAREL_HANDLE = "apparel"
const TOPS_CATEGORY_HANDLE = "tops"
const T_SHIRTS_CATEGORY_HANDLE = "t-shirts"

function slugToFallbackLabel(slug: string) {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

type CategoryRow = { id: string; handle: string }

async function ensureEgyptApparelProductCategories(args: {
  container: ExecArgs["container"]
  query: {
    graph: (query: Record<string, unknown>) => Promise<{ data?: unknown }>
  }
}) {
  const { container, query } = args
  const allHandles = [PARENT_APPAREL_HANDLE, TOPS_CATEGORY_HANDLE, T_SHIRTS_CATEGORY_HANDLE]

  const { data: existingRaw } = await query.graph({
    entity: "product_category",
    fields: ["id", "handle"],
    filters: { handle: allHandles },
  })

  const byHandle = new Map<string, CategoryRow>(
    ((existingRaw || []) as CategoryRow[]).map((row) => [row.handle, row])
  )

  const runCreateCategories = async (
    categories: Array<{ name: string; handle: string; is_active: boolean; parent_category_id?: string }>
  ) => {
    if (!categories.length) {
      return
    }

    const { result } = await createProductCategoriesWorkflow(container).run({
      input: { product_categories: categories },
    })

    for (const row of result as CategoryRow[]) {
      byHandle.set(row.handle, row)
    }
  }

  const parentsToCreate: Array<{ name: string; handle: string; is_active: boolean; parent_category_id?: string }> =
    []
  if (!byHandle.has(PARENT_APPAREL_HANDLE)) {
    parentsToCreate.push({
      name: "Apparel",
      handle: PARENT_APPAREL_HANDLE,
      is_active: true,
    })
  }
  await runCreateCategories(parentsToCreate)

  const apparelParent = byHandle.get(PARENT_APPAREL_HANDLE)
  if (!apparelParent) {
    throw new Error("Failed to resolve apparel root product category.")
  }

  if (!byHandle.has(TOPS_CATEGORY_HANDLE)) {
    await runCreateCategories([
      {
        name: "Tops",
        handle: TOPS_CATEGORY_HANDLE,
        is_active: true,
        parent_category_id: apparelParent.id,
      },
    ])
  }

  const topsParent = byHandle.get(TOPS_CATEGORY_HANDLE)
  if (!topsParent) {
    throw new Error("Failed to resolve tops product category.")
  }

  if (!byHandle.has(T_SHIRTS_CATEGORY_HANDLE)) {
    await runCreateCategories([
      {
        name: "T-shirts",
        handle: T_SHIRTS_CATEGORY_HANDLE,
        is_active: true,
        parent_category_id: topsParent.id,
      },
    ])
  }

  const tshirts = byHandle.get(T_SHIRTS_CATEGORY_HANDLE)
  if (!tshirts) {
    throw new Error("Failed to resolve t-shirts product category.")
  }

  return { apparelCategoryId: tshirts.id }
}

async function linkLegacyProductsToApparelCategory(args: {
  container: ExecArgs["container"]
  legacyProducts: LegacyProduct[]
  query: {
    graph: (query: Record<string, unknown>) => Promise<{ data?: unknown }>
  }
  apparelCategoryId: string
}) {
  const { apparelCategoryId, container, legacyProducts, query } = args

  const handles = legacyProducts.map((p) => p.slug)
  if (!handles.length) {
    return
  }

  const { data: productRows } = await query.graph({
    entity: "product",
    fields: ["id", "handle"],
    filters: { handle: handles },
  })

  const productIdByHandle = new Map(
    ((productRows || []) as Array<{ id: string; handle: string }>).map((row) => [row.handle, row.id])
  )
  const uniqueIds = legacyProducts
    .map((legacyProduct) => productIdByHandle.get(legacyProduct.slug))
    .filter((productId): productId is string => Boolean(productId))

  if (!uniqueIds.length) {
    return
  }

  await batchLinkProductsToCategoryWorkflow(container).run({
    input: {
      id: apparelCategoryId,
      add: [...new Set(uniqueIds)],
      remove: [],
    },
  })
}

const OCCASION_ACCENT_BY_SLUG: Record<string, string> = {
  "gift-something-real": "#C4A574",
  "graduation-season": "#7D8771",
  "eid-and-ramadan": "#C5A15C",
  "birthday-pick": "#B77A67",
  "just-because": "#556F73",
}

function buildFeelingProductHandles(feelingSlug: string, legacyProducts: LegacyProduct[]) {
  return legacyProducts
    .filter((product) => normalizeLegacyWebFeelingSlug(product.feelingSlug) === feelingSlug)
    .map((product) => product.slug)
}

function buildSubfeelingProductHandles(subfeelingSlug: string, legacyProducts: LegacyProduct[]) {
  return legacyProducts
    .filter(
      (product) =>
        derivePrimarySubfeelingSlugFromLegacyProduct({
          slug: product.slug,
          feelingSlug: product.feelingSlug,
        }) === subfeelingSlug
    )
    .map((product) => product.slug)
}

function artistMetadataForSeedProduct(product: LegacyProduct, avatarBySlug: Map<string, string>) {
  const seedRow = ARTIST_SEED.find((artist) => artist.slug === product.artistSlug)

  if (!seedRow) {
    return undefined
  }

  const avatarUrl = avatarBySlug.get(product.artistSlug)?.trim()
  const out: { name: string; avatarUrl?: string } = { name: seedRow.name }

  if (avatarUrl) {
    out.avatarUrl = avatarUrl
  }

  return out
}

function metadataFromProduct(
  product: LegacyProduct,
  legacyProducts: LegacyProduct[],
  media: ProductMedia,
  uploadedMedia: ProductMedia,
  artistAvatarBySlug: Map<string, string>
) {
  const artistMeta = artistMetadataForSeedProduct(product, artistAvatarBySlug)

  return {
    apparelCategoryPath: "apparel/tops/t-shirts",
    artistSlug: product.artistSlug,
    ...(artistMeta ? { artist: artistMeta } : {}),
    artworkSlug: product.slug,
    availableSizes: product.availableSizes ?? [...DEFAULT_SIZES],
    capsuleSlugs: product.capsuleSlugs,
    catalogOrder: legacyProducts.findIndex((entry) => entry.slug === product.slug),
    complementarySlugs: product.complementarySlugs,
    customersAlsoBoughtSlugs: product.customersAlsoBoughtSlugs,
    decorationType: "graphic",
    fitLabel: product.fitLabel,
    frequentlyBoughtWithSlugs: product.frequentlyBoughtWithSlugs,
    garmentColors: product.garmentColors,
    inventoryHintBySize: product.inventoryHintBySize,
    media: uploadedMedia,
    merchandisingBadge: product.merchandisingBadge,
    occasionSlugs: product.occasionSlugs,
    pdpFitModels: product.pdpFitModels,
    primaryOccasionSlug: product.occasionSlugs[0] ?? null,
    priceEgp: product.priceEgp,
    stockNote: product.stockNote,
    story: product.story,
    trustBadges: product.trustBadges ?? [...DEFAULT_PRODUCT_TRUST_BADGES],
    useCase: product.useCase,
    wearerStories: product.wearerStories,
    legacyMedia: media,
  }
}

function buildMerchEventOccasionProducts(occasionSlug: string, legacyProducts: LegacyProduct[]) {
  return legacyProducts
    .filter((product) => product.occasionSlugs.includes(occasionSlug))
    .map((product) => product.slug)
}

function feelingCategoryMetadataFromSeed(row: FeelingTaxonomySeed, uploaded: {
  card: string
  hero: string
}) {
  return {
    accent: row.accent,
    tagline: row.tagline,
    manifesto: row.manifesto,
    card_image_src: uploaded.card,
    card_image_alt: row.cardImageAlt,
    hero_image_src: uploaded.hero,
    hero_image_alt: row.heroImageAlt,
    seo_title: `${row.name} | HORO Egypt`,
    seo_description: `Shop ${row.name} graphic tees — HORO Egypt.`,
  }
}

function subfeelingCategoryMetadataFromSeed(row: SubfeelingTaxonomySeed, uploaded: {
  card: string
  hero: string
}) {
  return {
    card_image_src: uploaded.card,
    card_image_alt: row.cardImageAlt,
    hero_image_src: uploaded.hero,
    hero_image_alt: row.heroImageAlt,
    seo_title: `${row.name} | HORO Egypt`,
    seo_description: `Shop ${row.name} graphic tees — HORO Egypt.`,
  }
}

async function ensureFeelingsProductCategories(args: {
  container: ExecArgs["container"]
  query: {
    graph: (query: Record<string, unknown>) => Promise<{ data?: unknown }>
  }
  uploadStorefrontAsset: (src: string) => Promise<string>
}): Promise<Map<string, string>> {
  const { container, query, uploadStorefrontAsset } = args
  const idByHandle = new Map<string, string>()

  const { data: rootRows } = await query.graph({
    entity: "product_category",
    fields: ["id", "handle"],
    filters: { handle: FEELINGS_ROOT_HANDLE },
  })
  let root = (rootRows as CategoryRow[] | undefined)?.[0]

  if (!root) {
    const { result } = await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: [
          {
            name: "Feelings",
            handle: FEELINGS_ROOT_HANDLE,
            is_active: true,
            rank: 0,
            description: "Shop by feeling — HORO taxonomy root.",
          },
        ],
      },
    })
    root = (result as CategoryRow[])[0]
  }

  if (!root) {
    throw new Error(`Failed to resolve "${FEELINGS_ROOT_HANDLE}" product category.`)
  }

  idByHandle.set(root.handle, root.id)

  for (const feeling of FEELING_TAXONOMY) {
    const { data: existing } = await query.graph({
      entity: "product_category",
      fields: ["id", "metadata"],
      filters: { handle: feeling.slug },
    })
    const row = (existing as Array<{ id: string; metadata?: unknown }> | undefined)?.[0]

    const reused =
      !isSeedForceRefreshMedia() && row ? feelingCardHeroFromCategoryMetadata(row.metadata) : null
    const uploaded = reused ?? {
      card: await uploadStorefrontAsset(feeling.cardImageSrc),
      hero: await uploadStorefrontAsset(feeling.heroImageSrc),
    }

    if (row) {
      idByHandle.set(feeling.slug, row.id)
      await updateProductCategoriesWorkflow(container).run({
        input: {
          selector: { id: row.id },
          update: {
            name: feeling.name,
            description: feeling.blurb,
            is_active: true,
            rank: feeling.sort_order,
            metadata: feelingCategoryMetadataFromSeed(feeling, uploaded),
            parent_category_id: root.id,
          },
        },
      })
    } else {
      const { result } = await createProductCategoriesWorkflow(container).run({
        input: {
          product_categories: [
            {
              name: feeling.name,
              handle: feeling.slug,
              description: feeling.blurb,
              is_active: true,
              rank: feeling.sort_order,
              parent_category_id: root.id,
              metadata: feelingCategoryMetadataFromSeed(feeling, uploaded),
            },
          ],
        },
      })
      const created = (result as CategoryRow[])[0]
      idByHandle.set(created.handle, created.id)
    }
  }

  for (const sub of SUBFEELING_TAXONOMY) {
    const parentId = idByHandle.get(sub.feeling_slug)
    if (!parentId) {
      throw new Error(`Missing parent feeling category "${sub.feeling_slug}" for subfeeling "${sub.slug}".`)
    }

    const { data: existing } = await query.graph({
      entity: "product_category",
      fields: ["id", "metadata"],
      filters: { handle: sub.slug },
    })
    const row = (existing as Array<{ id: string; metadata?: unknown }> | undefined)?.[0]

    const reused =
      !isSeedForceRefreshMedia() && row ? feelingCardHeroFromCategoryMetadata(row.metadata) : null
    const uploaded = reused ?? {
      card: await uploadStorefrontAsset(sub.cardImageSrc),
      hero: await uploadStorefrontAsset(sub.heroImageSrc),
    }

    if (row) {
      idByHandle.set(sub.slug, row.id)
      await updateProductCategoriesWorkflow(container).run({
        input: {
          selector: { id: row.id },
          update: {
            name: sub.name,
            description: sub.blurb,
            is_active: true,
            rank: sub.sort_order,
            metadata: subfeelingCategoryMetadataFromSeed(sub, uploaded),
            parent_category_id: parentId,
          },
        },
      })
    } else {
      const { result } = await createProductCategoriesWorkflow(container).run({
        input: {
          product_categories: [
            {
              name: sub.name,
              handle: sub.slug,
              description: sub.blurb,
              is_active: true,
              rank: sub.sort_order,
              parent_category_id: parentId,
              metadata: subfeelingCategoryMetadataFromSeed(sub, uploaded),
            },
          ],
        },
      })
      const created = (result as CategoryRow[])[0]
      idByHandle.set(created.handle, created.id)
    }
  }

  return idByHandle
}

async function linkLegacyProductsToFeelingCategories(args: {
  container: ExecArgs["container"]
  categoryIdByHandle: Map<string, string>
  legacyProducts: LegacyProduct[]
  query: {
    graph: (query: Record<string, unknown>) => Promise<{ data?: unknown }>
  }
}) {
  const { categoryIdByHandle, container, legacyProducts, query } = args

  const handles = legacyProducts.map((product) => product.slug)
  if (!handles.length) {
    return
  }

  const { data: productRows } = await query.graph({
    entity: "product",
    fields: ["id", "handle"],
    filters: { handle: handles },
  })

  const productIdByHandle = new Map(
    ((productRows || []) as Array<{ handle: string; id: string }>).map((row) => [row.handle, row.id])
  )

  const { data: allCategories } = await query.graph({
    entity: "product_category",
    fields: ["id", "handle", "parent_category_id"],
  })

  const feelingsRootId = categoryIdByHandle.get(FEELINGS_ROOT_HANDLE)
  if (!feelingsRootId) {
    return
  }

  const childrenByParent = new Map<string | null, string[]>()
  for (const row of (allCategories || []) as Array<{ id: string; parent_category_id?: string | null }>) {
    const parent = row.parent_category_id ?? null
    const list = childrenByParent.get(parent) || []
    list.push(row.id)
    childrenByParent.set(parent, list)
  }

  const feelingSubtreeIds = new Set<string>()
  const queue = [feelingsRootId]
  while (queue.length) {
    const id = queue.shift()!
    feelingSubtreeIds.add(id)
    const next = childrenByParent.get(id) || []
    queue.push(...next)
  }

  for (const product of legacyProducts) {
    const productId = productIdByHandle.get(product.slug)
    if (!productId) {
      continue
    }

    const feelingSlug = normalizeLegacyWebFeelingSlug(product.feelingSlug)
    const subSlug = derivePrimarySubfeelingSlugFromLegacyProduct({
      slug: product.slug,
      feelingSlug: product.feelingSlug,
    })

    const hasSubfeeling = SUBFEELING_TAXONOMY.some(
      (entry) => entry.feeling_slug === feelingSlug && entry.slug === subSlug
    )

    const targetHandle = hasSubfeeling ? subSlug : feelingSlug
    const targetCategoryId = categoryIdByHandle.get(targetHandle)
    if (!targetCategoryId) {
      continue
    }

    const { data: links } = await query.graph({
      entity: "product",
      fields: ["categories.id"],
      filters: { id: productId },
    })

    const catIds =
      ((links || [])[0] as { categories?: Array<{ id: string }> } | undefined)?.categories?.map((c) => c.id) || []

    for (const cid of catIds) {
      if (feelingSubtreeIds.has(cid) && cid !== targetCategoryId) {
        await batchLinkProductsToCategoryWorkflow(container).run({
          input: {
            id: cid,
            add: [],
            remove: [productId],
          },
        })
      }
    }

    if (!catIds.includes(targetCategoryId)) {
      await batchLinkProductsToCategoryWorkflow(container).run({
        input: {
          id: targetCategoryId,
          add: [productId],
          remove: [],
        },
      })
    }
  }
}

const EGYPT_STOCK_LOCATION_NAME = "Egypt Warehouse"
const EGYPT_FULFILLMENT_SET_NAME = "Egypt Delivery"
const EGYPT_SHIPPING_OPTION_NAME = "Standard"
const EGYPT_SHIPPING_OPTION_CODE = "standard"
const GIFT_WRAP_HANDLE = "gift-wrap"
const GIFT_WRAP_PRICE_AMOUNT = 20000

async function ensureLinkExists(
  link: { create: (input: Record<string, unknown>) => Promise<unknown> },
  input: Record<string, unknown>
) {
  try {
    await link.create(input)
  } catch (error) {
    const message = error instanceof Error ? error.message : ""

    if (!/(already exists|already linked|duplicate|exists)/i.test(message)) {
      throw error
    }
  }
}

async function ensureEgyptRegion(args: {
  container: ExecArgs["container"]
  query: {
    graph: (query: Record<string, unknown>) => Promise<{ data?: unknown }>
  }
}) {
  const { container, query } = args
  const paymentProviders = getEgyptRegionPaymentProviders()
  const { data: existingRegions } = await query.graph({
    entity: "region",
    fields: ["id", "name", "currency_code"],
    filters: { name: EGYPT_REGION_NAME },
    pagination: { take: 1 },
  })

  const existingRegion = (existingRegions?.[0] as { id: string } | undefined) ?? null

  if (!existingRegion) {
    const { result } = await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: EGYPT_REGION_NAME,
            currency_code: "egp",
            countries: ["eg"],
            payment_providers: paymentProviders,
          },
        ],
      },
    })

    return result[0]
  }

  const { result } = await updateRegionsWorkflow(container).run({
    input: {
      selector: { id: existingRegion.id },
      update: {
        payment_providers: paymentProviders,
      },
    },
  })

  return result[0]
}

async function ensureEgyptCheckoutInfrastructure(args: {
  container: ExecArgs["container"]
  query: {
    graph: (query: Record<string, unknown>) => Promise<{ data?: unknown }>
  }
  regionId: string
  salesChannelId: string
  storeId: string
}) {
  const { container, query, regionId, salesChannelId, storeId } = args
  const fulfillmentModuleService = container.resolve<any>(Modules.FULFILLMENT)
  const link = container.resolve<any>(ContainerRegistrationKeys.LINK)

  const { data: existingStockLocations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name"],
    filters: { name: EGYPT_STOCK_LOCATION_NAME },
    pagination: { take: 1 },
  })

  let stockLocation = (existingStockLocations?.[0] as { id: string } | undefined) ?? null

  if (!stockLocation) {
    const { result } = await createStockLocationsWorkflow(container).run({
      input: {
        locations: [
          {
            name: EGYPT_STOCK_LOCATION_NAME,
            address: {
              address_1: "Cairo, Egypt",
              city: "Cairo",
              country_code: "EG",
            },
          },
        ],
      },
    })

    stockLocation = result[0]
  }

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: storeId },
      update: {
        default_location_id: stockLocation.id,
      },
    },
  })

  await ensureLinkExists(link, {
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_provider_id: "manual_manual",
    },
  })

  const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({
    type: "default",
  })
  let shippingProfile = shippingProfiles[0] ?? null

  if (!shippingProfile) {
    const { result } = await createShippingProfilesWorkflow(container).run({
      input: {
        data: [
          {
            name: "Default Shipping Profile",
            type: "default",
          },
        ],
      },
    })
    shippingProfile = result[0]
  }

  const fulfillmentSets = await fulfillmentModuleService.listFulfillmentSets(
    { name: EGYPT_FULFILLMENT_SET_NAME },
    { relations: ["service_zones"] }
  )

  let fulfillmentSet = fulfillmentSets[0] ?? null

  if (!fulfillmentSet) {
    fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
      name: EGYPT_FULFILLMENT_SET_NAME,
      type: "shipping",
      service_zones: [
        {
          name: EGYPT_REGION_NAME,
          geo_zones: [
            {
              country_code: "eg",
              type: "country",
            },
          ],
        },
      ],
    })
  }

  const serviceZoneId = fulfillmentSet.service_zones?.[0]?.id

  if (!serviceZoneId) {
    throw new Error("Failed to resolve the Egypt service zone for checkout shipping.")
  }

  await ensureLinkExists(link, {
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_set_id: fulfillmentSet.id,
    },
  })

  const { data: existingShippingOptions } = await query.graph({
    entity: "shipping_option",
    fields: ["id", "name", "service_zone_id"],
    filters: {
      name: EGYPT_SHIPPING_OPTION_NAME,
      service_zone_id: serviceZoneId,
    },
    pagination: { take: 1 },
  })

  const shippingOptionRows = (existingShippingOptions || []) as Array<{ id: string }>

  if (!shippingOptionRows.length) {
    await createShippingOptionsWorkflow(container).run({
      input: [
        {
          name: EGYPT_SHIPPING_OPTION_NAME,
          price_type: "flat",
          provider_id: "manual_manual",
          service_zone_id: serviceZoneId,
          shipping_profile_id: shippingProfile.id,
          type: {
            code: EGYPT_SHIPPING_OPTION_CODE,
            description: "Standard delivery across Egypt.",
            label: "Standard",
          },
          prices: [
            {
              amount: 6000,
              region_id: regionId,
            },
          ],
          rules: [
            {
              attribute: "enabled_in_store",
              operator: "eq",
              value: "true",
            },
            {
              attribute: "is_return",
              operator: "eq",
              value: "false",
            },
          ],
        },
      ],
    })
  }

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: stockLocation.id,
      add: [salesChannelId],
    },
  })
}

export default async function seedEgyptCatalog({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const storeModuleService = container.resolve(Modules.STORE)
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const artistModuleService = container.resolve<ArtistModuleService>(ARTIST_MODULE)
  const occasionModuleService = container.resolve<OccasionModuleService>(OCCASION_MODULE)
  const merchEventModuleService = container.resolve<MerchEventModuleService>(MERCH_EVENT_MODULE)
  const { legacyOccasions, legacyProducts } = await loadLegacyCatalogPayload()
  const seedCatalogProducts: LegacyProduct[] = [...legacyProducts, ...buildEgyptHeroLegacyProducts()]

  logger.info("Seeding Egypt catalog data...")

  const [store] = await storeModuleService.listStores()
  if (!store) {
    throw new Error("No store found. Run Medusa migrations before seeding.")
  }

  let defaultSalesChannel = await salesChannelModuleService.listSalesChannels({
    name: "Default Sales Channel",
  })

  if (!defaultSalesChannel.length) {
    const { result } = await createSalesChannelsWorkflow(container).run({
      input: {
        salesChannelsData: [{ name: "Default Sales Channel" }],
      },
    })
    defaultSalesChannel = result
  }

  await updateStoreCurrencies(container).run({
    input: {
      store_id: store.id,
      supported_currencies: [{ currency_code: "egp", is_default: true }],
    },
  })

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: { default_sales_channel_id: defaultSalesChannel[0].id },
    },
  })

  const region = await ensureEgyptRegion({ container, query })

  await ensureEgyptCheckoutInfrastructure({
    container,
    query,
    regionId: region.id,
    salesChannelId: defaultSalesChannel[0].id,
    storeId: store.id,
  })

  let publishableApiKey: ApiKey | null = null
  const { data: apiKeys } = await query.graph({
    entity: "api_key",
    fields: ["id"],
    filters: { type: "publishable" },
  })
  publishableApiKey = (apiKeys?.[0] as ApiKey) || null

  if (!publishableApiKey) {
    const { result } = await createApiKeysWorkflow(container).run({
      input: {
        api_keys: [{ title: "Webshop", type: "publishable", created_by: "" }],
      },
    })
    publishableApiKey = result[0] as ApiKey
  }

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: {
      id: publishableApiKey.id,
      add: [defaultSalesChannel[0].id],
    },
  })

  const apparelTaxonomy = await ensureEgyptApparelProductCategories({
    container,
    query,
  })

  const { data: existingProducts } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "thumbnail", "images.url", "metadata"],
    filters: { handle: [...seedCatalogProducts.map((item) => item.slug), GIFT_WRAP_HANDLE] },
  })
  const existingProductRowByHandle = new Map(
    ((existingProducts || []) as ExistingProductSeedRow[]).map((product) => [product.handle, product])
  )

  const productHandlesOmitMediaOnUpdate = new Set<string>()

  const uploadCache = new Map<string, string>()
  const uploadStorefrontAsset = async (src: string) => {
    const resolvedPath = resolveStorefrontPublicAsset(src)
    const cached = uploadCache.get(resolvedPath)

    if (cached) {
      return cached
    }

    const uploaded = await uploadImage(container, resolvedPath)

    if (!uploaded) {
      throw new Error(`Failed to upload image: ${resolvedPath}`)
    }

    uploadCache.set(resolvedPath, uploaded)
    return uploaded
  }

  const existingArtists = new Map(
    (await artistModuleService.listArtists({ slug: ARTIST_SEED.map((artist) => artist.slug) }) as Array<{
      id: string
      slug: string
      avatar_src?: string | null
    }>).map((artist) => [artist.slug, artist])
  )

  const artistAvatarBySlug = new Map<string, string>()

  for (const artist of ARTIST_SEED) {
    const existingArtist = existingArtists.get(artist.slug)
    const avatar_src =
      !isSeedForceRefreshMedia() && existingArtist?.avatar_src
        ? existingArtist.avatar_src
        : await uploadStorefrontAsset(artist.avatarSrc)

    artistAvatarBySlug.set(artist.slug, avatar_src)

    const payload = {
      active: true,
      avatar_src,
      design_count: seedCatalogProducts.filter((product) => product.artistSlug === artist.slug).length,
      name: artist.name,
      slug: artist.slug,
      style: artist.style,
    }

    if (existingArtist) {
      await artistModuleService.updateArtists({
        selector: { id: existingArtist.id },
        data: payload,
      })
    } else {
      await artistModuleService.createArtists(payload)
    }
  }

  const productsInput: any[] = []
  for (const product of seedCatalogProducts) {
    const legacyMedia = getLegacyProductMedia(product.slug)
    const existingRow = existingProductRowByHandle.get(product.slug)
    const reusedMedia =
      !isSeedForceRefreshMedia() && existingRow ? productMediaFromExistingRow(existingRow) : null

    let uploadedMedia: ProductMedia
    if (reusedMedia) {
      uploadedMedia = reusedMedia
      productHandlesOmitMediaOnUpdate.add(product.slug)
    } else {
      uploadedMedia = {
        gallery: [],
        main: await uploadStorefrontAsset(legacyMedia.main),
      }

      for (const viewSrc of legacyMedia.gallery) {
        uploadedMedia.gallery.push(await uploadStorefrontAsset(viewSrc))
      }
    }

    const sizeValues = (product.availableSizes ?? [...DEFAULT_SIZES]) as readonly ProductSizeKey[]
    const allImages = Array.from(new Set(uploadedMedia.gallery)).map((url) => ({ url }))

    productsInput.push({
      title: product.name,
      handle: product.slug,
      description: product.story,
      status: ProductStatus.PUBLISHED,
      metadata: metadataFromProduct(product, seedCatalogProducts, legacyMedia, uploadedMedia, artistAvatarBySlug),
      images: allImages,
      thumbnail: uploadedMedia.main,
      options: [{ title: "Size", values: [...sizeValues] }],
      variants: sizeValues.map((size) => ({
        title: size,
        sku: `${product.slug.toUpperCase()}-${size}`,
        options: { Size: size },
        manage_inventory: false,
        allow_backorder: true,
        prices: [{ amount: product.priceEgp * 100, currency_code: "egp" }],
      })),
      sales_channels: [{ id: defaultSalesChannel[0].id }],
    })
  }

  productsInput.push({
    title: "Gift Wrap",
    handle: GIFT_WRAP_HANDLE,
    description: "Premium HORO gift wrapping and story card add-on.",
    status: ProductStatus.PUBLISHED,
    metadata: {
      hidden: true,
      is_add_on: true,
      merchandisingBadge: "Gift option",
    },
    images: [],
    thumbnail: "",
    options: [{ title: "Default", values: ["Default"] }],
    variants: [{
      title: "Default",
      sku: "GIFT-WRAP",
      options: { Default: "Default" },
      manage_inventory: false,
      allow_backorder: true,
      prices: [{ amount: GIFT_WRAP_PRICE_AMOUNT, currency_code: "egp" }],
    }],
    sales_channels: [{ id: defaultSalesChannel[0].id }],
  })

  const productsToCreate = productsInput.filter((product) => !existingProductRowByHandle.has(product.handle))
  const productsToUpdate = productsInput.filter((product) => existingProductRowByHandle.has(product.handle))

  if (productsToCreate.length) {
    await createProductsWorkflow(container).run({
      input: { products: productsToCreate },
    })
  }

  for (const product of productsToUpdate) {
    const existing = existingProductRowByHandle.get(product.handle)

    if (!existing) {
      continue
    }

    const omitMedia = productHandlesOmitMediaOnUpdate.has(product.handle)
    await updateProductsWorkflow(container).run({
      input: {
        selector: { id: existing.id },
        update: omitMedia
          ? {
              title: product.title,
              description: product.description,
              metadata: product.metadata,
            }
          : {
              title: product.title,
              description: product.description,
              metadata: product.metadata,
              images: product.images,
              thumbnail: product.thumbnail,
            },
      },
    })
  }

  await linkLegacyProductsToApparelCategory({
    apparelCategoryId: apparelTaxonomy.apparelCategoryId,
    container,
    query,
    legacyProducts: seedCatalogProducts,
  })

  const feelingCategoryIds = await ensureFeelingsProductCategories({
    container,
    query,
    uploadStorefrontAsset,
  })

  await linkLegacyProductsToFeelingCategories({
    categoryIdByHandle: feelingCategoryIds,
    container,
    legacyProducts: seedCatalogProducts,
    query,
  })

  const existingOccasions = new Map(
    (await occasionModuleService.listOccasions({ slug: legacyOccasions.map((occasion) => occasion.slug) }) as Array<{
      id: string
      slug: string
      card_image_src?: string | null
      hero_image_src?: string | null
    }>).map((occasion) => [occasion.slug, occasion])
  )

  for (const [index, occasion] of legacyOccasions.entries()) {
    const existingOccasion = existingOccasions.get(occasion.slug)
    const card_image_src =
      !isSeedForceRefreshMedia() && existingOccasion?.card_image_src
        ? existingOccasion.card_image_src
        : await uploadStorefrontAsset(occasion.cardImageSrc)
    const hero_image_src =
      !isSeedForceRefreshMedia() && existingOccasion?.hero_image_src
        ? existingOccasion.hero_image_src
        : await uploadStorefrontAsset(occasion.heroImageSrc)

    const payload = {
      accent: OCCASION_ACCENT_BY_SLUG[occasion.slug],
      active: true,
      blurb: occasion.blurb,
      card_image_alt: occasion.cardImageAlt,
      card_image_src,
      hero_image_alt: occasion.heroImageAlt,
      hero_image_src,
      is_gift_occasion: occasion.isGiftOccasion,
      name: occasion.name,
      price_hint: occasion.priceHint,
      product_handles: buildMerchEventOccasionProducts(occasion.slug, legacyProducts),
      seo_description: `Shop ${occasion.name} graphic tees and gift-ready streetwear from HORO Egypt.`,
      seo_title: `${occasion.name} | HORO Egypt`,
      slug: occasion.slug,
      sort_order: index * 10,
    }

    if (existingOccasion) {
      await occasionModuleService.updateOccasions({
        selector: { id: existingOccasion.id },
        data: payload,
      })
    } else {
      await occasionModuleService.createOccasions(payload)
    }
  }

  const existingEvents = new Map(
    (await merchEventModuleService.listMerchEvents({ slug: merchEvents.map((event) => event.slug) }) as Array<{
      id: string
      slug: string
      card_image_src?: string | null
      hero_image_src?: string | null
    }>).map((event) => [event.slug, event])
  )

  for (const event of merchEvents) {
    const existingEvent = existingEvents.get(event.slug)
    const card_image_src =
      !isSeedForceRefreshMedia() && existingEvent?.card_image_src
        ? existingEvent.card_image_src
        : await uploadStorefrontAsset(event.cardImageSrc)
    const hero_image_src =
      !isSeedForceRefreshMedia() && existingEvent?.hero_image_src
        ? existingEvent.hero_image_src
        : await uploadStorefrontAsset(event.heroImageSrc)

    const payload = {
      active: true,
      body: event.body,
      card_image_alt: event.cardImageAlt,
      card_image_src,
      ends_at: event.endsAt ? new Date(event.endsAt) : null,
      hero_image_alt: event.heroImageAlt,
      hero_image_src,
      name: event.name,
      occasion_slug: event.occasionSlug ?? null,
      product_handles: event.productHandles,
      seo_description: event.seoDescription,
      seo_title: event.seoTitle,
      slug: event.slug,
      sort_order: event.sortOrder,
      starts_at: event.startsAt ? new Date(event.startsAt) : null,
      status: event.status,
      teaser: event.teaser,
      type: event.type,
    }

    if (existingEvent) {
      await merchEventModuleService.updateMerchEvents({
        selector: { id: existingEvent.id },
        data: payload,
      })
    } else {
      await merchEventModuleService.createMerchEvents(payload)
    }
  }

  logger.info("Egypt catalog seed completed.")
}
