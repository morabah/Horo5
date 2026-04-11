import {
  ContainerRegistrationKeys,
  QueryContext,
} from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/types"

import { ARTIST_MODULE } from "../../modules/artist"
import type ArtistModuleService from "../../modules/artist/service"
import { FEELING_MODULE } from "../../modules/feeling"
import type FeelingModuleService from "../../modules/feeling/service"
import { MERCH_EVENT_MODULE } from "../../modules/merch-event"
import type MerchEventModuleService from "../../modules/merch-event/service"
import { OCCASION_MODULE } from "../../modules/occasion"
import type OccasionModuleService from "../../modules/occasion/service"
import { SUBFEELING_MODULE } from "../../modules/subfeeling"
import type SubfeelingModuleService from "../../modules/subfeeling/service"
import {
  inferFeelingSlugFromHandle,
  inferSubfeelingSlugFromHandle,
  LEGACY_FEELING_TO_TAXONOMY,
  LEGACY_SUBFEELING_TO_TAXONOMY,
} from "./legacy-compat"
import type {
  StorefrontArtistDTO,
  StorefrontCatalogDTO,
  StorefrontFeelingDTO,
  StorefrontMediaDTO,
  StorefrontMerchEventDTO,
  StorefrontOccasionDTO,
  StorefrontProductDTO,
  StorefrontSubfeelingDTO,
  StorefrontVariantDTO,
} from "./types"

export function filterStorefrontProductsByQuery(
  products: StorefrontProductDTO[],
  query: { category?: string; decoration?: string; occasion?: string }
): StorefrontProductDTO[] {
  let out = products
  const category = query.category?.trim().toLowerCase()

  if (category) {
    out = out.filter((product) => (product.apparelCategoryPath || "").toLowerCase().includes(category))
  }

  const decoration = query.decoration?.trim().toLowerCase()

  if (decoration === "plain" || decoration === "graphic" || decoration === "embroidered" || decoration === "mixed") {
    out = out.filter((product) => product.decorationType === decoration)
  }

  const occasion = query.occasion?.trim()

  if (occasion) {
    out = out.filter((product) => product.occasionSlugs.includes(occasion))
  }

  return out
}

type RegionDTO = {
  currency_code: string
  id: string
}

type QueryCategory = {
  handle?: string | null
  id: string
  name?: string | null
  parent_category?: QueryCategory | null
}

type QueryProduct = {
  categories?: QueryCategory[] | null
  description?: string | null
  handle: string
  id: string
  images?: Array<{ url?: string | null }> | null
  metadata?: Record<string, unknown> | null
  thumbnail?: string | null
  title: string
  variants?: QueryVariant[] | null
}

type QueryVariant = {
  allow_backorder?: boolean | null
  calculated_price?: {
    calculated_amount?: number | null
    currency_code?: string | null
    original_amount?: number | null
  } | null
  id: string
  inventory_items?: Array<{
    inventory?: {
      location_levels?: Array<{
        reserved_quantity?: number | null
        stocked_quantity?: number | null
      }> | null
    } | null
  }> | null
  manage_inventory?: boolean | null
  options?: Array<{
    option?: { title?: string | null } | null
    value?: string | null
  }> | null
  prices?: Array<{
    amount?: number | null
    currency_code?: string | null
  }> | null
  sku?: string | null
  title: string
}

export type FeelingRecord = {
  accent?: string | null
  active?: boolean | null
  blurb?: string | null
  card_image_alt?: string | null
  card_image_src?: string | null
  hero_image_alt?: string | null
  hero_image_src?: string | null
  manifesto?: string | null
  name: string
  seo_description?: string | null
  seo_title?: string | null
  slug: string
  sort_order?: number | null
  tagline?: string | null
}

export type ArtistRecord = {
  active?: boolean | null
  avatar_src?: string | null
  design_count?: number | null
  name: string
  slug: string
  style?: string | null
}

export type SubfeelingRecord = {
  active?: boolean | null
  blurb?: string | null
  card_image_alt?: string | null
  card_image_src?: string | null
  feeling_slug: string
  hero_image_alt?: string | null
  hero_image_src?: string | null
  name: string
  seo_description?: string | null
  seo_title?: string | null
  slug: string
  sort_order?: number | null
}

export type OccasionRecord = {
  accent?: string | null
  active?: boolean | null
  blurb?: string | null
  card_image_alt?: string | null
  card_image_src?: string | null
  hero_image_alt?: string | null
  hero_image_src?: string | null
  is_gift_occasion?: boolean | null
  name: string
  price_hint?: string | null
  product_handles?: string[] | null
  seo_description?: string | null
  seo_title?: string | null
  slug: string
  sort_order?: number | null
}

type MerchEventRecord = {
  active?: boolean | null
  body?: string | null
  card_image_alt?: string | null
  card_image_src?: string | null
  ends_at?: Date | string | null
  hero_image_alt?: string | null
  hero_image_src?: string | null
  name: string
  occasion_slug?: string | null
  product_handles?: string[] | null
  seo_description?: string | null
  seo_title?: string | null
  slug: string
  sort_order?: number | null
  starts_at?: Date | string | null
  status?: string | null
  teaser?: string | null
  type?: string | null
}

type ProductQueryFilters = {
  handle?: string
}

const PRODUCT_QUERY_FIELDS = [
  "id",
  "title",
  "handle",
  "description",
  "thumbnail",
  "images.url",
  "metadata",
  "categories.id",
  "categories.handle",
  "categories.name",
  "categories.parent_category.id",
  "categories.parent_category.handle",
  "categories.parent_category.parent_category.id",
  "categories.parent_category.parent_category.handle",
  "variants.id",
  "variants.title",
  "variants.sku",
  "variants.manage_inventory",
  "variants.allow_backorder",
  "variants.options.value",
  "variants.options.option.title",
  "variants.prices.amount",
  "variants.prices.currency_code",
  "variants.calculated_price.*",
  "variants.inventory_items.inventory.location_levels.stocked_quantity",
  "variants.inventory_items.inventory.location_levels.reserved_quantity",
]

const DEFAULT_APPAREL_CATEGORY_PATH = "apparel/tops/t-shirts"
const DEFAULT_SIZE_ORDER = ["S", "M", "L", "XL", "XXL"] as const

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {}
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined
  }

  const items = value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
  return items.length > 0 ? items : undefined
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

function asObjectArray<T extends Record<string, unknown>>(value: unknown): T[] | undefined {
  if (!Array.isArray(value)) {
    return undefined
  }

  const items = value.filter((entry): entry is T => Boolean(entry) && typeof entry === "object")
  return items.length > 0 ? items : undefined
}

function asMedia(value: unknown): StorefrontMediaDTO | undefined {
  if (!value || typeof value !== "object") {
    return undefined
  }

  const media = value as StorefrontMediaDTO
  const gallery = Array.isArray(media.gallery)
    ? media.gallery.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
    : []

  if (!media.main && gallery.length === 0) {
    return undefined
  }

  return {
    gallery: gallery.length > 0 ? gallery : undefined,
    main: media.main ?? undefined,
  }
}

function orderedUniqueStrings(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>()
  const ordered: string[] = []

  for (const value of values) {
    if (!value || seen.has(value)) {
      continue
    }

    seen.add(value)
    ordered.push(value)
  }

  return ordered
}

function galleryFromLegacyMedia(media: StorefrontMediaDTO | undefined): string[] {
  if (!media) {
    return []
  }

  return orderedUniqueStrings([media.main ?? undefined, ...(media.gallery || [])])
}

function variantSize(variant: QueryVariant): string {
  const optionSize = variant.options?.find((option) => {
    return (option.option?.title || "").toLowerCase() === "size"
  })?.value

  const raw = optionSize || variant.title
  const normalized = String(raw || "").toUpperCase()

  return normalized || "M"
}

function inventoryQuantity(variant: QueryVariant): number | null {
  if (!variant.manage_inventory) {
    return null
  }

  const total = (variant.inventory_items || []).reduce((variantSum, item) => {
    const itemTotal = (item.inventory?.location_levels || []).reduce((levelSum, level) => {
      return levelSum + Number(level.stocked_quantity || 0) - Number(level.reserved_quantity || 0)
    }, 0)

    return variantSum + itemTotal
  }, 0)

  return total
}

function sortVariantList(variants: StorefrontVariantDTO[]): StorefrontVariantDTO[] {
  return [...variants].sort((left, right) => {
    const leftIndex = DEFAULT_SIZE_ORDER.indexOf(left.size as (typeof DEFAULT_SIZE_ORDER)[number])
    const rightIndex = DEFAULT_SIZE_ORDER.indexOf(right.size as (typeof DEFAULT_SIZE_ORDER)[number])
    const normalizedLeft = leftIndex === -1 ? DEFAULT_SIZE_ORDER.length : leftIndex
    const normalizedRight = rightIndex === -1 ? DEFAULT_SIZE_ORDER.length : rightIndex

    if (normalizedLeft !== normalizedRight) {
      return normalizedLeft - normalizedRight
    }

    return left.size.localeCompare(right.size)
  })
}

function variantPrice(
  variant: QueryVariant,
  fallbackPriceEgp?: number
): { currency_code: string; is_discounted: boolean; original_price_egp: number | null; price_egp: number } {
  const calculatedAmount = variant.calculated_price?.calculated_amount
  const calculatedCurrency = variant.calculated_price?.currency_code
  const originalAmount = variant.calculated_price?.original_amount

  if (typeof calculatedAmount === "number") {
    const priceEgp = Math.round(calculatedAmount / 100)
    const originalPriceEgp =
      typeof originalAmount === "number" ? Math.round(originalAmount / 100) : null
    const hasDiscount = typeof originalPriceEgp === "number" && originalPriceEgp > priceEgp

    return {
      currency_code: calculatedCurrency || "egp",
      is_discounted: hasDiscount,
      original_price_egp: hasDiscount ? originalPriceEgp : null,
      price_egp: priceEgp,
    }
  }

  const egpPrice = variant.prices?.find((price) => (price.currency_code || "").toLowerCase() === "egp")

  if (typeof egpPrice?.amount === "number") {
    return {
      currency_code: "egp",
      is_discounted: false,
      original_price_egp: null,
      price_egp: Math.round(egpPrice.amount / 100),
    }
  }

  return {
    currency_code: "egp",
    is_discounted: false,
    original_price_egp: null,
    price_egp: fallbackPriceEgp ?? 0,
  }
}

function mapVariant(variant: QueryVariant, fallbackPriceEgp?: number): StorefrontVariantDTO {
  const { currency_code, is_discounted, original_price_egp, price_egp } = variantPrice(variant, fallbackPriceEgp)
  const qty = inventoryQuantity(variant)
  const allowBackorder = Boolean(variant.allow_backorder)
  const manageInventory = Boolean(variant.manage_inventory)

  return {
    allow_backorder: allowBackorder,
    available: !manageInventory || allowBackorder || qty === null || qty > 0,
    currency_code,
    id: variant.id,
    inventory_quantity: qty,
    is_discounted,
    manage_inventory: manageInventory,
    original_price_egp,
    price_egp,
    size: variantSize(variant),
    sku: variant.sku || null,
  }
}

function categoryPath(category: QueryCategory | null | undefined): string | undefined {
  if (!category?.handle) {
    return undefined
  }

  const handles: string[] = []
  let current: QueryCategory | null | undefined = category

  while (current?.handle) {
    handles.unshift(current.handle)
    current = current.parent_category
  }

  return handles.length > 0 ? handles.join("/") : undefined
}

function apparelCategoryPath(categories: QueryProduct["categories"]): string | undefined {
  const paths = (categories || [])
    .map((category) => categoryPath(category))
    .filter((value): value is string => Boolean(value))

  return paths.find((path) => path.startsWith("apparel")) || paths[0]
}

function normalizeFeelingSlug(value: string | undefined, handle: string): string {
  if (!value) {
    return inferFeelingSlugFromHandle(handle)
  }

  return LEGACY_FEELING_TO_TAXONOMY[value] || value
}

function normalizeSubfeelingSlug(value: string | undefined, handle: string, feelingSlug: string): string {
  if (!value) {
    return inferSubfeelingSlugFromHandle(handle, feelingSlug)
  }

  return LEGACY_SUBFEELING_TO_TAXONOMY[value] || value
}

function buildProduct(product: QueryProduct): StorefrontProductDTO {
  const metadata = asRecord(product.metadata)
  const legacyMedia = asMedia(metadata.media)
  const legacyPrice = typeof metadata.priceEgp === "number" ? metadata.priceEgp : undefined
  const mappedVariants = sortVariantList((product.variants || []).map((variant) => mapVariant(variant, legacyPrice)))
  const variantsBySize = Object.fromEntries(mappedVariants.map((variant) => [variant.size, variant]))
  const defaultVariant = mappedVariants.find((variant) => variant.available) || mappedVariants[0]
  const gallery = orderedUniqueStrings([
    ...(product.images || []).map((image) => image.url || undefined),
    ...galleryFromLegacyMedia(legacyMedia),
    product.thumbnail || undefined,
  ])
  const mainImage = gallery[0] || product.thumbnail || legacyMedia?.main || null
  const inventoryHints = asRecord(metadata.inventoryHintBySize) as Record<string, string>
  const rawFeelingSlug = asString(metadata.primaryFeelingSlug) || asString(metadata.feelingSlug)
  const primaryFeelingSlug = normalizeFeelingSlug(rawFeelingSlug, product.handle)
  const rawSubfeelingSlug = asString(metadata.primarySubfeelingSlug) || asString(metadata.lineSlug)
  const primarySubfeelingSlug = normalizeSubfeelingSlug(rawSubfeelingSlug, product.handle, primaryFeelingSlug)
  const apparelPath =
    apparelCategoryPath(product.categories) ||
    asString(metadata.apparelCategoryPath) ||
    DEFAULT_APPAREL_CATEGORY_PATH
  const explicitDecoration = asString(metadata.decorationType) as StorefrontProductDTO["decorationType"] | undefined
  const decorationType: StorefrontProductDTO["decorationType"] =
    explicitDecoration ||
    (asString(metadata.artworkSlug) ? "graphic" : "plain")

  return {
    apparelCategoryPath: apparelPath,
    artistSlug: asString(metadata.artistSlug) || "nada-ibrahim",
    artworkSlug: asString(metadata.artworkSlug),
    availableSizes: mappedVariants.length > 0 ? mappedVariants.map((variant) => variant.size) : asStringArray(metadata.availableSizes),
    capsuleSlugs: asStringArray(metadata.capsuleSlugs),
    complementarySlugs: asStringArray(metadata.complementarySlugs),
    customersAlsoBoughtSlugs: asStringArray(metadata.customersAlsoBoughtSlugs),
    decorationType,
    defaultPriceSize: defaultVariant?.size,
    description: product.description || asString(metadata.story) || undefined,
    feelingSlug: primaryFeelingSlug,
    fitLabel: asString(metadata.fitLabel),
    frequentlyBoughtWithSlugs: asStringArray(metadata.frequentlyBoughtWithSlugs),
    garmentColors: asStringArray(metadata.garmentColors),
    inventoryHintBySize: Object.keys(inventoryHints).length > 0 ? inventoryHints : undefined,
    lineSlug: primarySubfeelingSlug,
    media:
      mainImage || gallery.length > 0
        ? {
            gallery: gallery.length > 0 ? gallery : undefined,
            main: mainImage,
          }
        : undefined,
    merchandisingBadge: asString(metadata.merchandisingBadge),
    name: product.title,
    occasionSlugs: asStringArray(metadata.occasionSlugs) || [],
    originalPriceEgp: defaultVariant?.original_price_egp ?? null,
    pdpFitModels: asObjectArray(metadata.pdpFitModels),
    primaryFeelingSlug,
    primaryOccasionSlug: asString(metadata.primaryOccasionSlug),
    primarySubfeelingSlug,
    priceEgp: defaultVariant?.price_egp ?? legacyPrice ?? 0,
    slug: product.handle,
    stockNote: asString(metadata.stockNote),
    story: asString(metadata.story) || product.description || "",
    thumbnail: mainImage,
    useCase: asString(metadata.useCase),
    variantsBySize,
    wearerStories: asObjectArray(metadata.wearerStories),
  }
}

export function buildArtist(artist: ArtistRecord): StorefrontArtistDTO {
  return {
    active: artist.active !== false,
    avatarSrc: artist.avatar_src || undefined,
    designCount: Number(artist.design_count || 0),
    name: artist.name,
    slug: artist.slug,
    style: artist.style || "",
  }
}

export function buildFeeling(feeling: FeelingRecord): StorefrontFeelingDTO {
  return {
    accent: feeling.accent || undefined,
    active: feeling.active !== false,
    blurb: feeling.blurb || "",
    cardImageAlt: feeling.card_image_alt || feeling.name,
    cardImageSrc: feeling.card_image_src || "",
    heroImageAlt: feeling.hero_image_alt || feeling.name,
    heroImageSrc: feeling.hero_image_src || feeling.card_image_src || "",
    manifesto: feeling.manifesto || undefined,
    name: feeling.name,
    seoDescription: feeling.seo_description || undefined,
    seoTitle: feeling.seo_title || undefined,
    slug: feeling.slug,
    sortOrder: Number(feeling.sort_order || 0),
    tagline: feeling.tagline || undefined,
  }
}

export function buildSubfeeling(subfeeling: SubfeelingRecord): StorefrontSubfeelingDTO {
  return {
    active: subfeeling.active !== false,
    blurb: subfeeling.blurb || "",
    cardImageAlt: subfeeling.card_image_alt || subfeeling.name,
    cardImageSrc: subfeeling.card_image_src || "",
    feelingSlug: subfeeling.feeling_slug,
    heroImageAlt: subfeeling.hero_image_alt || subfeeling.name,
    heroImageSrc: subfeeling.hero_image_src || subfeeling.card_image_src || "",
    name: subfeeling.name,
    seoDescription: subfeeling.seo_description || undefined,
    seoTitle: subfeeling.seo_title || undefined,
    slug: subfeeling.slug,
    sortOrder: Number(subfeeling.sort_order || 0),
  }
}

export function buildOccasion(occasion: OccasionRecord): StorefrontOccasionDTO {
  return {
    accent: occasion.accent || undefined,
    active: occasion.active !== false,
    blurb: occasion.blurb || "",
    cardImageAlt: occasion.card_image_alt || occasion.name,
    cardImageSrc: occasion.card_image_src || "",
    heroImageAlt: occasion.hero_image_alt || occasion.name,
    heroImageSrc: occasion.hero_image_src || occasion.card_image_src || "",
    isGiftOccasion: Boolean(occasion.is_gift_occasion),
    name: occasion.name,
    priceHint: occasion.price_hint || undefined,
    productHandles: occasion.product_handles || [],
    seoDescription: occasion.seo_description || undefined,
    seoTitle: occasion.seo_title || undefined,
    slug: occasion.slug,
    sortOrder: Number(occasion.sort_order || 0),
  }
}

function buildMerchEvent(event: MerchEventRecord): StorefrontMerchEventDTO {
  const serializeDate = (value: Date | string | null | undefined) => {
    if (!value) {
      return undefined
    }

    return value instanceof Date ? value.toISOString() : value
  }

  return {
    active: event.active !== false,
    body: event.body || "",
    cardImageAlt: event.card_image_alt || undefined,
    cardImageSrc: event.card_image_src || undefined,
    endsAt: serializeDate(event.ends_at),
    heroImageAlt: event.hero_image_alt || undefined,
    heroImageSrc: event.hero_image_src || undefined,
    name: event.name,
    occasionSlug: event.occasion_slug || undefined,
    productHandles: event.product_handles || [],
    seoDescription: event.seo_description || undefined,
    seoTitle: event.seo_title || undefined,
    slug: event.slug,
    sortOrder: Number(event.sort_order || 0),
    startsAt: serializeDate(event.starts_at),
    status: event.status || "scheduled",
    teaser: event.teaser || "",
    type: event.type || "campaign",
  }
}

export async function resolveEgyptPricingContext(scope: MedusaContainer) {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "region",
    fields: ["id", "currency_code"],
    filters: { currency_code: "egp" },
    pagination: {
      take: 1,
    },
  })
  const region = ((data || [])[0] as RegionDTO | undefined) ?? null

  if (!region) {
    return null
  }

  return {
    currency_code: region.currency_code,
    region_id: region.id,
  }
}

function sortStorefrontProducts(products: QueryProduct[]) {
  return products
    .map((product) => {
      const metadata = asRecord(product.metadata)
      return {
        order: asNumber(metadata.catalogOrder) ?? Number.MAX_SAFE_INTEGER,
        product: buildProduct(product),
      }
    })
    .sort((left, right) => left.order - right.order)
    .map((entry) => entry.product)
}

async function queryStorefrontProducts(scope: MedusaContainer, filters: ProductQueryFilters = {}, take = 200) {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const pricingContext = await resolveEgyptPricingContext(scope)
  const context = pricingContext
    ? {
        variants: {
          calculated_price: QueryContext(pricingContext),
        },
      }
    : undefined

  const { data } = await query.graph(
    {
      entity: "product",
      fields: PRODUCT_QUERY_FIELDS,
      filters,
      pagination: {
        order: {
          created_at: "ASC",
        },
        take,
      },
      context,
    }
  )

  return data as QueryProduct[]
}

export async function listStorefrontProducts(scope: MedusaContainer) {
  return sortStorefrontProducts(await queryStorefrontProducts(scope))
}

export async function retrieveStorefrontProduct(scope: MedusaContainer, handle: string) {
  const products = sortStorefrontProducts(await queryStorefrontProducts(scope, { handle }, 1))
  return products[0] || null
}

export async function listStorefrontArtists(scope: MedusaContainer) {
  const artistService = scope.resolve<ArtistModuleService>(ARTIST_MODULE)
  const artists = await artistService.listArtists({})

  return (artists as ArtistRecord[])
    .map(buildArtist)
    .filter((artist) => artist.active)
    .sort((left, right) => left.name.localeCompare(right.name))
}

export async function listStorefrontFeelings(scope: MedusaContainer) {
  const feelingService = scope.resolve<FeelingModuleService>(FEELING_MODULE)
  const feelings = await feelingService.listFeelings({})

  return (feelings as FeelingRecord[])
    .map(buildFeeling)
    .sort((left, right) => left.sortOrder - right.sortOrder)
}

export async function retrieveStorefrontFeeling(scope: MedusaContainer, slug: string) {
  const feelingService = scope.resolve<FeelingModuleService>(FEELING_MODULE)
  const feelings = await feelingService.listFeelings({ slug })

  return (feelings as FeelingRecord[])
    .map(buildFeeling)
    .find((feeling) => feeling.slug === slug) || null
}

export async function listStorefrontSubfeelings(scope: MedusaContainer) {
  const subfeelingService = scope.resolve<SubfeelingModuleService>(SUBFEELING_MODULE)
  const subfeelings = await subfeelingService.listSubfeelings({})

  return (subfeelings as SubfeelingRecord[])
    .map(buildSubfeeling)
    .sort((left, right) => left.sortOrder - right.sortOrder)
}

export async function retrieveStorefrontSubfeeling(scope: MedusaContainer, slug: string) {
  const subfeelingService = scope.resolve<SubfeelingModuleService>(SUBFEELING_MODULE)
  const subfeelings = await subfeelingService.listSubfeelings({ slug })

  return (subfeelings as SubfeelingRecord[])
    .map(buildSubfeeling)
    .find((subfeeling) => subfeeling.slug === slug) || null
}

export async function listStorefrontOccasions(scope: MedusaContainer) {
  const occasionService = scope.resolve<OccasionModuleService>(OCCASION_MODULE)
  const occasions = await occasionService.listOccasions({})

  return (occasions as OccasionRecord[])
    .map(buildOccasion)
    .sort((left, right) => left.sortOrder - right.sortOrder)
}

export async function retrieveStorefrontOccasion(scope: MedusaContainer, slug: string) {
  const occasionService = scope.resolve<OccasionModuleService>(OCCASION_MODULE)
  const occasions = await occasionService.listOccasions({ slug })

  return (occasions as OccasionRecord[])
    .map(buildOccasion)
    .find((occasion) => occasion.slug === slug) || null
}

export async function listStorefrontMerchEvents(scope: MedusaContainer) {
  const merchEventService = scope.resolve<MerchEventModuleService>(MERCH_EVENT_MODULE)
  const events = await merchEventService.listMerchEvents({})

  return (events as MerchEventRecord[])
    .map(buildMerchEvent)
    .sort((left, right) => left.sortOrder - right.sortOrder)
}

export async function retrieveStorefrontMerchEvent(scope: MedusaContainer, slug: string) {
  const merchEventService = scope.resolve<MerchEventModuleService>(MERCH_EVENT_MODULE)
  const events = await merchEventService.listMerchEvents({ slug })

  return (events as MerchEventRecord[])
    .map(buildMerchEvent)
    .find((event) => event.slug === slug) || null
}

export async function buildStorefrontCatalog(scope: MedusaContainer): Promise<StorefrontCatalogDTO> {
  const [artists, products, feelings, subfeelings, occasions, events] = await Promise.all([
    listStorefrontArtists(scope),
    listStorefrontProducts(scope),
    listStorefrontFeelings(scope),
    listStorefrontSubfeelings(scope),
    listStorefrontOccasions(scope),
    listStorefrontMerchEvents(scope),
  ])

  return {
    artists,
    events,
    feelings,
    occasions,
    products,
    subfeelings,
  }
}
