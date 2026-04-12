import fs from "node:fs/promises"
import { existsSync } from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"

import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules, ProductStatus } from "@medusajs/framework/utils"
import {
  batchLinkProductsToCategoryWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createApiKeysWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  updateProductCategoriesWorkflow,
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
  useCase?: string
  wearerStories?: unknown[]
}

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
    resolveRepoFile("../web/src/data/dev-fixtures.ts", "web/src/data/dev-fixtures.ts")
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

  return `../web/public${src}`
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

function metadataFromProduct(
  product: LegacyProduct,
  legacyProducts: LegacyProduct[],
  media: ProductMedia,
  uploadedMedia: ProductMedia
) {
  return {
    apparelCategoryPath: "apparel/tops/t-shirts",
    artistSlug: product.artistSlug,
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
    const uploaded = {
      card: await uploadStorefrontAsset(feeling.cardImageSrc),
      hero: await uploadStorefrontAsset(feeling.heroImageSrc),
    }

    const { data: existing } = await query.graph({
      entity: "product_category",
      fields: ["id"],
      filters: { handle: feeling.slug },
    })
    const row = (existing as Array<{ id: string }> | undefined)?.[0]

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

    const uploaded = {
      card: await uploadStorefrontAsset(sub.cardImageSrc),
      hero: await uploadStorefrontAsset(sub.heroImageSrc),
    }

    const { data: existing } = await query.graph({
      entity: "product_category",
      fields: ["id"],
      filters: { handle: sub.slug },
    })
    const row = (existing as Array<{ id: string }> | undefined)?.[0]

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

  const { data: existingRegions } = await query.graph({
    entity: "region",
    fields: ["id", "name"],
    filters: { name: "Egypt" },
  })

  if (!existingRegions.length) {
    await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: "Egypt",
            currency_code: "egp",
            countries: ["eg"],
            payment_providers: ["pp_system_default"],
          },
        ],
      },
    })
  }

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
    fields: ["id", "handle"],
    filters: { handle: seedCatalogProducts.map((item) => item.slug) },
  })
  const existingProductByHandle = new Map(
    ((existingProducts || []) as Array<{ handle: string; id: string }>).map((product) => [product.handle, product])
  )

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
    }>).map((artist) => [artist.slug, artist])
  )

  for (const artist of ARTIST_SEED) {
    const payload = {
      active: true,
      avatar_src: await uploadStorefrontAsset(artist.avatarSrc),
      design_count: seedCatalogProducts.filter((product) => product.artistSlug === artist.slug).length,
      name: artist.name,
      slug: artist.slug,
      style: artist.style,
    }

    const existing = existingArtists.get(artist.slug)

    if (existing) {
      await artistModuleService.updateArtists({
        selector: { id: existing.id },
        data: payload,
      })
    } else {
      await artistModuleService.createArtists(payload)
    }
  }

  const productsInput: any[] = []
  for (const product of seedCatalogProducts) {
    const legacyMedia = getLegacyProductMedia(product.slug)
    const uploadedMedia: ProductMedia = {
      gallery: [],
      main: await uploadStorefrontAsset(legacyMedia.main),
    }

    for (const viewSrc of legacyMedia.gallery) {
      uploadedMedia.gallery.push(await uploadStorefrontAsset(viewSrc))
    }

    const sizeValues = (product.availableSizes ?? [...DEFAULT_SIZES]) as readonly ProductSizeKey[]
    const allImages = Array.from(new Set(uploadedMedia.gallery)).map((url) => ({ url }))

    productsInput.push({
      title: product.name,
      handle: product.slug,
      description: product.story,
      status: ProductStatus.PUBLISHED,
      metadata: metadataFromProduct(product, seedCatalogProducts, legacyMedia, uploadedMedia),
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

  const productsToCreate = productsInput.filter((product) => !existingProductByHandle.has(product.handle))
  const productsToUpdate = productsInput.filter((product) => existingProductByHandle.has(product.handle))

  if (productsToCreate.length) {
    await createProductsWorkflow(container).run({
      input: { products: productsToCreate },
    })
  }

  for (const product of productsToUpdate) {
    const existing = existingProductByHandle.get(product.handle)

    if (!existing) {
      continue
    }

    await updateProductsWorkflow(container).run({
      input: {
        selector: { id: existing.id },
        update: {
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
    }>).map((occasion) => [occasion.slug, occasion])
  )

  for (const [index, occasion] of legacyOccasions.entries()) {
    const payload = {
      accent: OCCASION_ACCENT_BY_SLUG[occasion.slug],
      active: true,
      blurb: occasion.blurb,
      card_image_alt: occasion.cardImageAlt,
      card_image_src: await uploadStorefrontAsset(occasion.cardImageSrc),
      hero_image_alt: occasion.heroImageAlt,
      hero_image_src: await uploadStorefrontAsset(occasion.heroImageSrc),
      is_gift_occasion: occasion.isGiftOccasion,
      name: occasion.name,
      price_hint: occasion.priceHint,
      product_handles: buildMerchEventOccasionProducts(occasion.slug, legacyProducts),
      seo_description: `Shop ${occasion.name} graphic tees and gift-ready streetwear from HORO Egypt.`,
      seo_title: `${occasion.name} | HORO Egypt`,
      slug: occasion.slug,
      sort_order: index * 10,
    }

    const existing = existingOccasions.get(occasion.slug)

    if (existing) {
      await occasionModuleService.updateOccasions({
        selector: { id: existing.id },
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
    }>).map((event) => [event.slug, event])
  )

  for (const event of merchEvents) {
    const payload = {
      active: true,
      body: event.body,
      card_image_alt: event.cardImageAlt,
      card_image_src: await uploadStorefrontAsset(event.cardImageSrc),
      ends_at: event.endsAt ? new Date(event.endsAt) : null,
      hero_image_alt: event.heroImageAlt,
      hero_image_src: await uploadStorefrontAsset(event.heroImageSrc),
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

    const existing = existingEvents.get(event.slug)

    if (existing) {
      await merchEventModuleService.updateMerchEvents({
        selector: { id: existing.id },
        data: payload,
      })
    } else {
      await merchEventModuleService.createMerchEvents(payload)
    }
  }

  logger.info("Egypt catalog seed completed.")
}
