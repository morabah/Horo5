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
import { ARTIST_MODULE } from "../modules/artist"
import type ArtistModuleService from "../modules/artist/service"
import { FEELING_MODULE } from "../modules/feeling"
import type FeelingModuleService from "../modules/feeling/service"
import { getLegacyProductMedia } from "./data/legacy-product-media"
import { merchEvents } from "./data/merch-events"
import { MERCH_EVENT_MODULE } from "../modules/merch-event"
import type MerchEventModuleService from "../modules/merch-event/service"
import { OCCASION_MODULE } from "../modules/occasion"
import type OccasionModuleService from "../modules/occasion/service"
import { SUBFEELING_MODULE } from "../modules/subfeeling"
import type SubfeelingModuleService from "../modules/subfeeling/service"

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

const FEELING_SEED: Array<{
  slug: string
  name: string
  blurb: string
  tagline: string
  manifesto: string
  accent: string
  cardImageSrc: string
  cardImageAlt: string
  heroImageSrc: string
  heroImageAlt: string
  sort_order: number
}> = [
  {
    slug: "mood",
    accent: "#B77A67",
    name: "Mood",
    blurb: "For emotional honesty, slower days, and pieces that read like a feeling before they read like a trend.",
    tagline: "For emotional honesty, slower days, and pieces that read like a feeling before they read like a trend.",
    manifesto: "Wear the feeling before you explain it.",
    cardImageSrc: "/images/tees/emotions_vibe_1_1774374034307.png",
    cardImageAlt: "Mood cover — emotional graphic tee styling.",
    heroImageSrc: "/images/tees/emotions_vibe_1_1774374034307.png",
    heroImageAlt: "Mood hero — HORO emotional graphic tee.",
    sort_order: 0,
  },
  {
    slug: "zodiac",
    accent: "#C5A15C",
    name: "Zodiac",
    blurb: "For cosmic identity, signs, and symbolism-led stories.",
    tagline: "For cosmic identity, signs, and symbolism-led stories.",
    manifesto: "Personal signs, bigger energy.",
    cardImageSrc: "/images/tees/zodiac_vibe_1_1774374128029.png",
    cardImageAlt: "Zodiac cover — cosmic graphic tee styling.",
    heroImageSrc: "/images/tees/zodiac_vibe_1_1774374128029.png",
    heroImageAlt: "Zodiac hero — HORO zodiac graphic tee.",
    sort_order: 10,
  },
  {
    slug: "trends",
    accent: "#556F73",
    name: "Trends",
    blurb: "For streetwear language, visible statements, and culture-led drops.",
    tagline: "For streetwear language, visible statements, and culture-led drops.",
    manifesto: "Current without becoming disposable.",
    cardImageSrc: "/images/tees/bg_vibe_trends.png",
    cardImageAlt: "Trends cover — bold streetwear tee styling.",
    heroImageSrc: "/images/tees/bg_vibe_trends.png",
    heroImageAlt: "Trends hero — HORO trends graphic tee.",
    sort_order: 20,
  },
  {
    slug: "career",
    accent: "#7D8771",
    name: "Career",
    blurb: "For ambition, office humor, and work-life identity.",
    tagline: "For ambition, office humor, and work-life identity.",
    manifesto: "Built for the work mode and the jokes about it.",
    cardImageSrc: "/images/tees/career_vibe_1_1774374340994.png",
    cardImageAlt: "Career cover — professional graphic tee styling.",
    heroImageSrc: "/images/tees/career_vibe_1_1774374340994.png",
    heroImageAlt: "Career hero — HORO career graphic tee.",
    sort_order: 30,
  },
  {
    slug: "fiction",
    accent: "#6A5B76",
    name: "Fiction",
    blurb: "For fandoms, story worlds, and reference-heavy graphics.",
    tagline: "For fandoms, story worlds, and reference-heavy graphics.",
    manifesto: "Specific stories beat generic graphics.",
    cardImageSrc: "/images/tees/fiction_vibe_1_1774374247152.png",
    cardImageAlt: "Fiction cover — playful graphic tee styling.",
    heroImageSrc: "/images/tees/fiction_vibe_1_1774374247152.png",
    heroImageAlt: "Fiction hero — HORO fiction graphic tee.",
    sort_order: 40,
  },
]

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

const SUBFEELING_SEED: Array<{
  slug: string
  feeling_slug: string
  name: string
  blurb: string
  cardImageSrc: string
  cardImageAlt: string
  heroImageSrc: string
  heroImageAlt: string
  sort_order: number
}> = [
  { slug: "i-care", feeling_slug: "mood", name: "I Care", blurb: "Emotionally open, sincere, and direct.", cardImageSrc: "/images/tees/emotions_vibe_1_1774374034307.png", cardImageAlt: "I Care cover", heroImageSrc: "/images/tees/emotions_vibe_1_1774374034307.png", heroImageAlt: "I Care hero", sort_order: 0 },
  { slug: "i-dont-care", feeling_slug: "mood", name: "I Don't Care", blurb: "Detached, dry, and intentionally unbothered.", cardImageSrc: "/images/tees/emotions_vibe_4_1774374088034.png", cardImageAlt: "I Don't Care cover", heroImageSrc: "/images/tees/emotions_vibe_4_1774374088034.png", heroImageAlt: "I Don't Care hero", sort_order: 10 },
  { slug: "overthinking", feeling_slug: "mood", name: "Overthinking", blurb: "Racing thoughts, spirals, and internal monologue energy.", cardImageSrc: "/images/tees/emotions_vibe_2_1774374055078.png", cardImageAlt: "Overthinking cover", heroImageSrc: "/images/tees/emotions_vibe_2_1774374055078.png", heroImageAlt: "Overthinking hero", sort_order: 20 },
  { slug: "numb", feeling_slug: "mood", name: "Numb", blurb: "Muted reactions and colder emotional distance.", cardImageSrc: "/images/tees/emotions_vibe_5_1774374107073.png", cardImageAlt: "Numb cover", heroImageSrc: "/images/tees/emotions_vibe_5_1774374107073.png", heroImageAlt: "Numb hero", sort_order: 30 },
  { slug: "fire-sign", feeling_slug: "zodiac", name: "Fire Sign", blurb: "Bold, expressive, and extroverted sign energy.", cardImageSrc: "/images/tees/zodiac_vibe_1_1774374128029.png", cardImageAlt: "Fire Sign cover", heroImageSrc: "/images/tees/zodiac_vibe_1_1774374128029.png", heroImageAlt: "Fire Sign hero", sort_order: 40 },
  { slug: "earth-sign", feeling_slug: "zodiac", name: "Earth Sign", blurb: "Grounded, practical, and steady sign energy.", cardImageSrc: "/images/tees/zodiac_vibe_2_1774374153203.png", cardImageAlt: "Earth Sign cover", heroImageSrc: "/images/tees/zodiac_vibe_2_1774374153203.png", heroImageAlt: "Earth Sign hero", sort_order: 50 },
  { slug: "air-sign", feeling_slug: "zodiac", name: "Air Sign", blurb: "Curious, fast-moving, and mentally sharp sign energy.", cardImageSrc: "/images/tees/zodiac_vibe_3_1774374174567.png", cardImageAlt: "Air Sign cover", heroImageSrc: "/images/tees/zodiac_vibe_3_1774374174567.png", heroImageAlt: "Air Sign hero", sort_order: 60 },
  { slug: "water-sign", feeling_slug: "zodiac", name: "Water Sign", blurb: "Intuitive, emotional, and symbolic sign energy.", cardImageSrc: "/images/tees/zodiac_vibe_5_1774374214170.png", cardImageAlt: "Water Sign cover", heroImageSrc: "/images/tees/zodiac_vibe_5_1774374214170.png", heroImageAlt: "Water Sign hero", sort_order: 70 },
  { slug: "streetwear", feeling_slug: "trends", name: "Streetwear", blurb: "Street references, hype language, and drop culture.", cardImageSrc: "/images/tees/bg_vibe_trends.png", cardImageAlt: "Streetwear cover", heroImageSrc: "/images/tees/bg_vibe_trends.png", heroImageAlt: "Streetwear hero", sort_order: 80 },
  { slug: "minimal", feeling_slug: "trends", name: "Minimal", blurb: "Cleaner layouts, quieter graphics, sharper restraint.", cardImageSrc: "/images/tees/bg_tee_studio_tee.png", cardImageAlt: "Minimal cover", heroImageSrc: "/images/tees/bg_tee_studio_tee.png", heroImageAlt: "Minimal hero", sort_order: 90 },
  { slug: "statement", feeling_slug: "trends", name: "Statement", blurb: "High-contrast graphics built to be noticed.", cardImageSrc: "/images/tees/bg_tee_outdoor.png", cardImageAlt: "Statement cover", heroImageSrc: "/images/tees/bg_tee_outdoor.png", heroImageAlt: "Statement hero", sort_order: 100 },
  { slug: "viral-energy", feeling_slug: "trends", name: "Viral Energy", blurb: "Internet-native references and fast-moving culture cues.", cardImageSrc: "/images/tees/tee_walking_street.png", cardImageAlt: "Viral Energy cover", heroImageSrc: "/images/tees/tee_walking_street.png", heroImageAlt: "Viral Energy hero", sort_order: 110 },
  { slug: "ambition", feeling_slug: "career", name: "Ambition", blurb: "Achievement, drive, and professional hunger.", cardImageSrc: "/images/tees/career_vibe_1_1774374340994.png", cardImageAlt: "Ambition cover", heroImageSrc: "/images/tees/career_vibe_1_1774374340994.png", heroImageAlt: "Ambition hero", sort_order: 120 },
  { slug: "burnout", feeling_slug: "career", name: "Burnout", blurb: "Work fatigue, survival mode, and the cost of hustle.", cardImageSrc: "/images/tees/career_vibe_2_1774374359412.png", cardImageAlt: "Burnout cover", heroImageSrc: "/images/tees/career_vibe_2_1774374359412.png", heroImageAlt: "Burnout hero", sort_order: 130 },
  { slug: "office-humor", feeling_slug: "career", name: "Office Humor", blurb: "Corporate jokes, work sarcasm, and deadline comedy.", cardImageSrc: "/images/tees/bg_tee_man_casual.png", cardImageAlt: "Office Humor cover", heroImageSrc: "/images/tees/bg_tee_man_casual.png", heroImageAlt: "Office Humor hero", sort_order: 140 },
  { slug: "work-mode", feeling_slug: "career", name: "Work Mode", blurb: "Switched on, focused, and performance-driven.", cardImageSrc: "/images/tees/bg_vibe_career.png", cardImageAlt: "Work Mode cover", heroImageSrc: "/images/tees/bg_vibe_career.png", heroImageAlt: "Work Mode hero", sort_order: 150 },
  { slug: "sci-fi", feeling_slug: "fiction", name: "Sci-Fi", blurb: "Futurism, cyber worlds, and speculative graphics.", cardImageSrc: "/images/tees/fiction_vibe_1_1774374247152.png", cardImageAlt: "Sci-Fi cover", heroImageSrc: "/images/tees/fiction_vibe_1_1774374247152.png", heroImageAlt: "Sci-Fi hero", sort_order: 160 },
  { slug: "fantasy", feeling_slug: "fiction", name: "Fantasy", blurb: "Mythic worlds, symbols, and imagined realms.", cardImageSrc: "/images/tees/fiction_vibe_2_1774374267156.png", cardImageAlt: "Fantasy cover", heroImageSrc: "/images/tees/fiction_vibe_2_1774374267156.png", heroImageAlt: "Fantasy hero", sort_order: 170 },
  { slug: "gaming", feeling_slug: "fiction", name: "Gaming", blurb: "Game language, references, and player identity.", cardImageSrc: "/images/tees/fiction_vibe_4_1774374302082.png", cardImageAlt: "Gaming cover", heroImageSrc: "/images/tees/fiction_vibe_4_1774374302082.png", heroImageAlt: "Gaming hero", sort_order: 180 },
  { slug: "anime", feeling_slug: "fiction", name: "Anime", blurb: "Character-led graphics and fandom-first styling.", cardImageSrc: "/images/tees/fiction_vibe_5_1774374319387.png", cardImageAlt: "Anime cover", heroImageSrc: "/images/tees/fiction_vibe_5_1774374319387.png", heroImageAlt: "Anime hero", sort_order: 190 },
]

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
    feelingSlug: normalizeLegacyWebFeelingSlug(product.feelingSlug),
    lineSlug: derivePrimarySubfeelingSlugFromLegacyProduct({
      slug: product.slug,
      feelingSlug: product.feelingSlug,
    }),
    frequentlyBoughtWithSlugs: product.frequentlyBoughtWithSlugs,
    garmentColors: product.garmentColors,
    inventoryHintBySize: product.inventoryHintBySize,
    media: uploadedMedia,
    merchandisingBadge: product.merchandisingBadge,
    occasionSlugs: product.occasionSlugs,
    pdpFitModels: product.pdpFitModels,
    primaryFeelingSlug: normalizeLegacyWebFeelingSlug(product.feelingSlug),
    primaryOccasionSlug: product.occasionSlugs[0] ?? null,
    primarySubfeelingSlug: derivePrimarySubfeelingSlugFromLegacyProduct({
      slug: product.slug,
      feelingSlug: product.feelingSlug,
    }),
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

export default async function seedEgyptCatalog({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const storeModuleService = container.resolve(Modules.STORE)
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const artistModuleService = container.resolve<ArtistModuleService>(ARTIST_MODULE)
  const feelingModuleService = container.resolve<FeelingModuleService>(FEELING_MODULE)
  const occasionModuleService = container.resolve<OccasionModuleService>(OCCASION_MODULE)
  const merchEventModuleService = container.resolve<MerchEventModuleService>(MERCH_EVENT_MODULE)
  const subfeelingModuleService = container.resolve<SubfeelingModuleService>(SUBFEELING_MODULE)
  const { legacyOccasions, legacyProducts } = await loadLegacyCatalogPayload()

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
    filters: { handle: legacyProducts.map((item) => item.slug) },
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
      design_count: legacyProducts.filter((product) => product.artistSlug === artist.slug).length,
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
  for (const product of legacyProducts) {
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
      metadata: metadataFromProduct(product, legacyProducts, legacyMedia, uploadedMedia),
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
    legacyProducts,
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

  const existingFeelings = new Map(
    (await feelingModuleService.listFeelings({ slug: FEELING_SEED.map((feeling) => feeling.slug) }) as Array<{
      id: string
      slug: string
    }>).map((feeling) => [feeling.slug, feeling])
  )

  for (const feeling of FEELING_SEED) {
    const payload = {
      active: true,
      accent: feeling.accent,
      blurb: feeling.blurb,
      manifesto: feeling.manifesto,
      tagline: feeling.tagline,
      card_image_alt: feeling.cardImageAlt,
      card_image_src: await uploadStorefrontAsset(feeling.cardImageSrc),
      hero_image_alt: feeling.heroImageAlt,
      hero_image_src: await uploadStorefrontAsset(feeling.heroImageSrc),
      name: feeling.name,
      seo_description: `Shop ${feeling.name} graphic tees — HORO Egypt.`,
      seo_title: `${feeling.name} | HORO Egypt`,
      slug: feeling.slug,
      sort_order: feeling.sort_order,
    }

    const existing = existingFeelings.get(feeling.slug)

    if (existing) {
      await feelingModuleService.updateFeelings({
        selector: { id: existing.id },
        data: payload,
      })
    } else {
      await feelingModuleService.createFeelings(payload)
    }
  }

  const existingSubfeelings = new Map(
    (await subfeelingModuleService.listSubfeelings({ slug: SUBFEELING_SEED.map((subfeeling) => subfeeling.slug) }) as Array<{
      id: string
      slug: string
    }>).map((subfeeling) => [subfeeling.slug, subfeeling])
  )

  for (const subfeeling of SUBFEELING_SEED) {
    const payload = {
      active: true,
      blurb: subfeeling.blurb,
      card_image_alt: subfeeling.cardImageAlt,
      card_image_src: await uploadStorefrontAsset(subfeeling.cardImageSrc),
      feeling_slug: subfeeling.feeling_slug,
      hero_image_alt: subfeeling.heroImageAlt,
      hero_image_src: await uploadStorefrontAsset(subfeeling.heroImageSrc),
      name: subfeeling.name,
      seo_description: `Shop ${subfeeling.name} graphic tees — HORO Egypt.`,
      seo_title: `${subfeeling.name} | HORO Egypt`,
      slug: subfeeling.slug,
      sort_order: subfeeling.sort_order,
    }

    const existing = existingSubfeelings.get(subfeeling.slug)

    if (existing) {
      await subfeelingModuleService.updateSubfeelings({
        selector: { id: existing.id },
        data: payload,
      })
    } else {
      await subfeelingModuleService.createSubfeelings(payload)
    }
  }

  logger.info("Egypt catalog seed completed.")
}
