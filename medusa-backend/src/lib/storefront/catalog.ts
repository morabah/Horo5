import {
  ContainerRegistrationKeys,
  QueryContext,
} from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/types"

import { ARTIST_MODULE } from "../../modules/artist"
import type ArtistModuleService from "../../modules/artist/service"
import { MERCH_EVENT_MODULE } from "../../modules/merch-event"
import type MerchEventModuleService from "../../modules/merch-event/service"
import { OCCASION_MODULE } from "../../modules/occasion"
import type OccasionModuleService from "../../modules/occasion/service"
import { FEELINGS_ROOT_HANDLE } from "./feeling-category-metadata"
import type { CategoryNode, FlatCategoryRow, FeelingBrowseAssignmentRaw } from "./feeling-category-tree"
import {
  collectFeelingBrowseAssignmentsFromFlatCategoryIds,
  collectFeelingBrowseAssignmentsFromNestedCategories,
  derivePrimaryFeelingSlugsFromFlat,
  derivePrimaryFeelingSlugsFromProductCategories,
} from "./feeling-category-tree"
import {
  inferFeelingSlugFromHandle,
  inferSubfeelingSlugFromHandle,
  LEGACY_FEELING_TO_TAXONOMY,
  LEGACY_SUBFEELING_TO_TAXONOMY,
} from "./legacy-compat"
import type {
  StorefrontArtistDTO,
  StorefrontCatalogDTO,
  StorefrontFeelingBrowseAssignmentDTO,
  StorefrontFeelingDTO,
  StorefrontMediaDTO,
  StorefrontMerchEventDTO,
  StorefrontOccasionDTO,
  StorefrontProductArtistDisplayDTO,
  StorefrontProductDTO,
  StorefrontProductPhysicalAttributesDTO,
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

type QueryCategory = CategoryNode & {
  id: string
  parent_category?: QueryCategory | null
}

type QueryProduct = {
  categories?: QueryCategory[] | null
  description?: string | null
  handle: string
  height?: string | null
  hs_code?: string | null
  id: string
  images?: Array<{ url?: string | null }> | null
  length?: string | null
  material?: string | null
  metadata?: Record<string, unknown> | null
  mid_code?: string | null
  origin_country?: string | null
  thumbnail?: string | null
  title: string
  weight?: string | null
  width?: string | null
  variants?: QueryVariant[] | null
}

type QueryVariant = {
  allow_backorder?: boolean | null
  calculated_price?: {
    calculated_amount?: number | null
    currency_code?: string | null
    original_amount?: number | null
  } | null
  height?: number | string | null
  hs_code?: string | null
  id: string
  inventory_items?: Array<{
    inventory?: {
      location_levels?: Array<{
        reserved_quantity?: number | null
        stocked_quantity?: number | null
      }> | null
    } | null
  }> | null
  length?: number | string | null
  manage_inventory?: boolean | null
  material?: string | null
  mid_code?: string | null
  options?: Array<{
    option?: { title?: string | null } | null
    value?: string | null
  }> | null
  origin_country?: string | null
  prices?: Array<{
    amount?: number | null
    currency_code?: string | null
  }> | null
  sku?: string | null
  title: string
  weight?: number | string | null
  width?: number | string | null
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
  "weight",
  "length",
  "height",
  "width",
  "origin_country",
  "hs_code",
  "mid_code",
  "material",
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
  "categories.metadata",
  "categories.description",
  "categories.rank",
  "categories.is_active",
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
  "variants.weight",
  "variants.length",
  "variants.height",
  "variants.width",
  "variants.origin_country",
  "variants.hs_code",
  "variants.mid_code",
  "variants.material",
  "variants.inventory_items.inventory.location_levels.stocked_quantity",
  "variants.inventory_items.inventory.location_levels.reserved_quantity",
]

const DEFAULT_APPAREL_CATEGORY_PATH = "apparel/tops/t-shirts"
const DEFAULT_SIZE_ORDER = ["S", "M", "L", "XL", "XXL"] as const
const LEGACY_STOREFRONT_TRUST_BADGES = [
  "220 GSM cotton",
  "Free exchange 14d",
  "COD available",
] as const

function categoryToFeelingRecord(category: CategoryNode): FeelingRecord {
  const meta = asRecord(category.metadata)
  return {
    accent: asString(meta.accent),
    active: category.is_active !== false,
    blurb: (typeof category.description === "string" ? category.description : "") || "",
    card_image_alt: asString(meta.card_image_alt),
    card_image_src: asString(meta.card_image_src),
    hero_image_alt: asString(meta.hero_image_alt),
    hero_image_src: asString(meta.hero_image_src),
    manifesto: asString(meta.manifesto),
    name: category.name || category.handle || "",
    seo_description: asString(meta.seo_description),
    seo_title: asString(meta.seo_title),
    slug: category.handle || "",
    sort_order: typeof category.rank === "number" ? category.rank : 0,
    tagline: asString(meta.tagline),
  }
}

function categoryToSubfeelingRecord(category: CategoryNode, feelingSlug: string): SubfeelingRecord {
  const meta = asRecord(category.metadata)
  return {
    active: category.is_active !== false,
    blurb: (typeof category.description === "string" ? category.description : "") || "",
    card_image_alt: asString(meta.card_image_alt),
    card_image_src: asString(meta.card_image_src),
    feeling_slug: feelingSlug,
    hero_image_alt: asString(meta.hero_image_alt),
    hero_image_src: asString(meta.hero_image_src),
    name: category.name || category.handle || "",
    seo_description: asString(meta.seo_description),
    seo_title: asString(meta.seo_title),
    slug: category.handle || "",
    sort_order: typeof category.rank === "number" ? category.rank : 0,
  }
}

export async function fetchProductCategoryByHandle(
  scope: MedusaContainer,
  handle: string
): Promise<CategoryNode | null> {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "product_category",
    fields: [
      "id",
      "handle",
      "name",
      "description",
      "metadata",
      "rank",
      "is_active",
      "parent_category_id",
      "parent_category.id",
      "parent_category.handle",
      "parent_category.parent_category.handle",
    ],
    filters: { handle },
    pagination: {
      take: 1,
    },
  })

  return ((data || [])[0] as CategoryNode) ?? null
}

export async function fetchChildCategoriesOfParent(
  scope: MedusaContainer,
  parentId: string
): Promise<CategoryNode[]> {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "product_category",
    fields: ["id", "handle", "name", "description", "metadata", "rank", "is_active", "parent_category_id"],
    filters: { parent_category_id: parentId },
    pagination: {
      order: {
        rank: "ASC",
      },
      take: 500,
    },
  })

  const rows = (data || []) as CategoryNode[]
  return rows.sort((left, right) => Number(left.rank ?? 0) - Number(right.rank ?? 0))
}

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

function isHiddenProduct(product: QueryProduct) {
  const metadata = asRecord(product.metadata)
  return metadata.hidden === true || metadata.hidden === "true"
}

function normalizeFeelingBrowseAssignments(
  raw: FeelingBrowseAssignmentRaw[],
  productHandle: string
): StorefrontFeelingBrowseAssignmentDTO[] {
  const seen = new Set<string>()
  const out: StorefrontFeelingBrowseAssignmentDTO[] = []

  for (const row of raw) {
    const feelingSlug = normalizeFeelingSlug(row.feelingSlug, productHandle)
    const subfeelingSlug = row.subfeelingSlug
      ? normalizeSubfeelingSlug(row.subfeelingSlug, productHandle, feelingSlug)
      : ""
    const key = `${feelingSlug}\0${subfeelingSlug}`
    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    out.push({ feelingSlug, subfeelingSlug })
  }

  return out
}

function trimPhysicalDisplayValue(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : undefined
  }

  if (typeof value === "string") {
    const trimmed = value.trim()

    return trimmed.length > 0 ? trimmed : undefined
  }

  return undefined
}

function buildPhysicalAttributes(
  product: QueryProduct,
  defaultVariantId: string | undefined
): StorefrontProductPhysicalAttributesDTO | undefined {
  const rawVariants = product.variants || []
  const rawDefault = defaultVariantId
    ? rawVariants.find((variant) => variant.id === defaultVariantId)
    : rawVariants[0]

  const weight =
    trimPhysicalDisplayValue(product.weight) ?? trimPhysicalDisplayValue(rawDefault?.weight)
  const length =
    trimPhysicalDisplayValue(product.length) ?? trimPhysicalDisplayValue(rawDefault?.length)
  const height =
    trimPhysicalDisplayValue(product.height) ?? trimPhysicalDisplayValue(rawDefault?.height)
  const width =
    trimPhysicalDisplayValue(product.width) ?? trimPhysicalDisplayValue(rawDefault?.width)
  const originCountry =
    trimPhysicalDisplayValue(product.origin_country) ??
    trimPhysicalDisplayValue(rawDefault?.origin_country)
  const hsCode =
    trimPhysicalDisplayValue(product.hs_code) ?? trimPhysicalDisplayValue(rawDefault?.hs_code)
  const midCode =
    trimPhysicalDisplayValue(product.mid_code) ?? trimPhysicalDisplayValue(rawDefault?.mid_code)
  const material =
    trimPhysicalDisplayValue(product.material) ?? trimPhysicalDisplayValue(rawDefault?.material)

  const out: StorefrontProductPhysicalAttributesDTO = {}

  if (weight) {
    out.weight = weight
  }

  if (length) {
    out.length = length
  }

  if (height) {
    out.height = height
  }

  if (width) {
    out.width = width
  }

  if (originCountry) {
    out.originCountry = originCountry
  }

  if (hsCode) {
    out.hsCode = hsCode
  }

  if (midCode) {
    out.midCode = midCode
  }

  if (material) {
    out.material = material
  }

  return Object.keys(out).length > 0 ? out : undefined
}

function parseArtistDisplayFromMetadata(metadata: Record<string, unknown>): StorefrontProductArtistDisplayDTO | undefined {
  const nested = metadata.artist

  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    const rec = nested as Record<string, unknown>
    const name = asString(rec.name)?.trim()

    if (!name) {
      return undefined
    }

    const avatarUrl =
      asString(rec.avatarUrl)?.trim() ||
      asString(rec.avatar_src)?.trim() ||
      undefined

    return avatarUrl ? { name, avatarUrl } : { name }
  }

  const flatName = asString(metadata.artistName)?.trim()

  if (flatName) {
    const avatarUrl = asString(metadata.artistAvatarUrl)?.trim()
    return avatarUrl ? { name: flatName, avatarUrl } : { name: flatName }
  }

  return undefined
}

function resolveArtistDisplay(
  metadata: Record<string, unknown>,
  artistsBySlug?: Map<string, StorefrontArtistDTO>
): StorefrontProductArtistDisplayDTO | undefined {
  const fromMeta = parseArtistDisplayFromMetadata(metadata)

  if (fromMeta) {
    return fromMeta
  }

  const slug = asString(metadata.artistSlug) || "nada-ibrahim"
  const fromModule = artistsBySlug?.get(slug)

  if (fromModule) {
    return {
      name: fromModule.name,
      ...(fromModule.avatarSrc ? { avatarUrl: fromModule.avatarSrc } : {}),
    }
  }

  return undefined
}

function buildProduct(
  product: QueryProduct,
  categoriesById?: Map<string, FlatCategoryRow>,
  artistsBySlug?: Map<string, StorefrontArtistDTO>
): StorefrontProductDTO {
  const metadata = asRecord(product.metadata)
  const legacyMedia = asMedia(metadata.media)
  const legacyPrice = typeof metadata.priceEgp === "number" ? metadata.priceEgp : undefined
  const trustBadges = asStringArray(metadata.trustBadges) || []
  const mappedVariants = sortVariantList((product.variants || []).map((variant) => mapVariant(variant, legacyPrice)))
  const variantsBySize = Object.fromEntries(mappedVariants.map((variant) => [variant.size, variant]))
  const defaultVariant = mappedVariants.find((variant) => variant.available) || mappedVariants[0]
  const physicalAttributes = buildPhysicalAttributes(product, defaultVariant?.id)
  const gallery = orderedUniqueStrings([
    ...(product.images || []).map((image) => image.url || undefined),
    ...galleryFromLegacyMedia(legacyMedia),
    product.thumbnail || undefined,
  ])
  const mainImage = gallery[0] || product.thumbnail || legacyMedia?.main || null
  const inventoryHints = asRecord(metadata.inventoryHintBySize) as Record<string, string>
  const derived = categoriesById
    ? derivePrimaryFeelingSlugsFromFlat(
        product.categories?.map((c) => c.id),
        categoriesById,
        FEELINGS_ROOT_HANDLE
      )
    : derivePrimaryFeelingSlugsFromProductCategories(
        product.categories as QueryCategory[] | null,
        FEELINGS_ROOT_HANDLE
      )
  const legacyFb = String(process.env.STOREFRONT_FEELINGS_LEGACY_FALLBACK || "").trim().toLowerCase() !== "false"
  const rawFeelingSlug = asString(metadata.primaryFeelingSlug) || asString(metadata.feelingSlug)
  const rawSubfeelingSlug = asString(metadata.primarySubfeelingSlug) || asString(metadata.lineSlug)

  let primaryFeelingSlug: string
  let primarySubfeelingSlug: string

  if (derived) {
    primaryFeelingSlug = normalizeFeelingSlug(derived.primaryFeelingSlug, product.handle)
    primarySubfeelingSlug = derived.primarySubfeelingSlug
      ? normalizeSubfeelingSlug(derived.primarySubfeelingSlug, product.handle, primaryFeelingSlug)
      : ""
  } else if (legacyFb) {
    primaryFeelingSlug = normalizeFeelingSlug(rawFeelingSlug, product.handle)
    primarySubfeelingSlug = normalizeSubfeelingSlug(rawSubfeelingSlug, product.handle, primaryFeelingSlug)
  } else {
    primaryFeelingSlug = normalizeFeelingSlug(undefined, product.handle)
    primarySubfeelingSlug = normalizeSubfeelingSlug(undefined, product.handle, primaryFeelingSlug)
  }

  const feelingBrowseEligible = derived !== null || legacyFb

  const rawFeelingBrowseAssignments = categoriesById
    ? collectFeelingBrowseAssignmentsFromFlatCategoryIds(
        product.categories?.map((category) => category.id),
        categoriesById,
        FEELINGS_ROOT_HANDLE
      )
    : collectFeelingBrowseAssignmentsFromNestedCategories(
        product.categories as QueryCategory[] | null,
        FEELINGS_ROOT_HANDLE
      )
  const feelingBrowseAssignments =
    rawFeelingBrowseAssignments.length > 0
      ? normalizeFeelingBrowseAssignments(rawFeelingBrowseAssignments, product.handle)
      : undefined

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
    artistDisplay: resolveArtistDisplay(metadata, artistsBySlug),
    artistSlug: asString(metadata.artistSlug) || "nada-ibrahim",
    artworkSlug: asString(metadata.artworkSlug),
    availableSizes: mappedVariants.length > 0 ? mappedVariants.map((variant) => variant.size) : asStringArray(metadata.availableSizes),
    capsuleSlugs: asStringArray(metadata.capsuleSlugs),
    complementarySlugs: asStringArray(metadata.complementarySlugs),
    customersAlsoBoughtSlugs: asStringArray(metadata.customersAlsoBoughtSlugs),
    decorationType,
    defaultPriceSize: defaultVariant?.size,
    feelingBrowseEligible,
    feelingBrowseAssignments,
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
    physicalAttributes,
    primaryFeelingSlug,
    primaryOccasionSlug: asString(metadata.primaryOccasionSlug),
    primarySubfeelingSlug,
    priceEgp: defaultVariant?.price_egp ?? legacyPrice ?? 0,
    slug: product.handle,
    stockNote: asString(metadata.stockNote),
    story: asString(metadata.story) || product.description || "",
    thumbnail: mainImage,
    trustBadges: trustBadges.length > 0 ? trustBadges : [...LEGACY_STOREFRONT_TRUST_BADGES],
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

function sortStorefrontProducts(
  products: QueryProduct[],
  categoriesById?: Map<string, FlatCategoryRow>,
  artistsBySlug?: Map<string, StorefrontArtistDTO>
) {
  return products
    .filter((product) => !isHiddenProduct(product))
    .map((product) => {
      const metadata = asRecord(product.metadata)
      return {
        order: asNumber(metadata.catalogOrder) ?? Number.MAX_SAFE_INTEGER,
        product: buildProduct(product, categoriesById, artistsBySlug),
      }
    })
    .sort((left, right) => left.order - right.order)
    .map((entry) => entry.product)
}

const DEFAULT_SERVER_CACHE_MS = 60_000

function parsePositiveMsEnv(name: string, fallback: number): number {
  const raw = String(process.env[name] ?? "").trim()
  if (raw === "0") {
    return 0
  }
  if (raw === "") {
    return fallback
  }
  const n = Number(raw)
  return Number.isFinite(n) && n >= 0 ? n : fallback
}

/** In-memory flat category graph for storefront product mapping (Phase 2). Disabled when ms is 0. */
let categoryGraphCache: { expiresAt: number; map: Map<string, FlatCategoryRow> } | null = null

async function loadCategoriesByIdMap(
  scope: MedusaContainer,
  profileCatalog: boolean
): Promise<Map<string, FlatCategoryRow>> {
  const ttlMs = parsePositiveMsEnv("STOREFRONT_CATEGORY_GRAPH_CACHE_MS", DEFAULT_SERVER_CACHE_MS)
  const now = Date.now()
  if (ttlMs > 0 && categoryGraphCache && categoryGraphCache.expiresAt > now) {
    return new Map(categoryGraphCache.map)
  }

  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const tCategories = profileCatalog ? Date.now() : 0
  const { data: allCategoriesRows } = await query.graph({
    entity: "product_category",
    fields: ["id", "handle", "parent_category_id"],
    pagination: {
      take: 2000,
    },
  })
  if (profileCatalog) {
    console.info(`[storefront/profile] category_graph_ms=${Date.now() - tCategories}`)
  }

  const categoriesById = new Map<string, FlatCategoryRow>()
  for (const row of (allCategoriesRows || []) as FlatCategoryRow[]) {
    categoriesById.set(row.id, row)
  }

  if (ttlMs > 0) {
    categoryGraphCache = { expiresAt: now + ttlMs, map: categoriesById }
    return new Map(categoriesById)
  }

  return categoriesById
}

async function queryStorefrontProducts(scope: MedusaContainer, filters: ProductQueryFilters = {}, take = 200) {
  const profileCatalog = String(process.env.STOREFRONT_PROFILE_CATALOG || "").trim() === "1"
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const pricingContext = await resolveEgyptPricingContext(scope)
  const context = pricingContext
    ? {
        variants: {
          calculated_price: QueryContext(pricingContext),
        },
      }
    : undefined

  const tProducts = profileCatalog ? Date.now() : 0
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
  if (profileCatalog) {
    console.info(`[storefront/profile] product_graph_ms=${Date.now() - tProducts}`)
  }

  const categoriesById = await loadCategoriesByIdMap(scope, profileCatalog)

  return {
    products: data as QueryProduct[],
    categoriesById,
  }
}

export async function listStorefrontProducts(scope: MedusaContainer, artists?: StorefrontArtistDTO[]) {
  const artistList = artists ?? (await listStorefrontArtists(scope))
  const artistsBySlug = new Map(artistList.map((artist) => [artist.slug, artist]))
  const result = await queryStorefrontProducts(scope)
  return sortStorefrontProducts(result.products, result.categoriesById, artistsBySlug)
}

export async function retrieveStorefrontProduct(scope: MedusaContainer, handle: string) {
  const artistList = await listStorefrontArtists(scope)
  const artistsBySlug = new Map(artistList.map((artist) => [artist.slug, artist]))
  const result = await queryStorefrontProducts(scope, { handle }, 1)
  const products = sortStorefrontProducts(result.products, result.categoriesById, artistsBySlug)
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

/**
 * Single feelings-root walk for catalog: avoids duplicating fetchProductCategoryByHandle +
 * fetchChildCategoriesOfParent when both pillars and lines are needed (see buildStorefrontCatalog).
 */
async function loadFeelingsAndSubfeelingsForCatalog(scope: MedusaContainer): Promise<{
  feelings: StorefrontFeelingDTO[]
  subfeelings: StorefrontSubfeelingDTO[]
}> {
  const profileCatalog = String(process.env.STOREFRONT_PROFILE_CATALOG || "").trim() === "1"
  const t0 = profileCatalog ? Date.now() : 0

  const root = await fetchProductCategoryByHandle(scope, FEELINGS_ROOT_HANDLE)
  if (!root?.id) {
    return { feelings: [], subfeelings: [] }
  }

  const children = await fetchChildCategoriesOfParent(scope, root.id)
  const active = children.filter((category) => category.is_active !== false)
  if (active.length === 0) {
    return { feelings: [], subfeelings: [] }
  }

  const feelings = active.map((category) => buildFeeling(categoryToFeelingRecord(category)))
  const subRows: SubfeelingRecord[] = []

  for (const feeling of active) {
    if (!feeling.id) {
      continue
    }

    const subs = await fetchChildCategoriesOfParent(scope, feeling.id)
    for (const sub of subs) {
      if (sub.is_active === false || !sub.handle) {
        continue
      }

      subRows.push(categoryToSubfeelingRecord(sub, feeling.handle || ""))
    }
  }

  const subfeelings =
    subRows.length > 0
      ? subRows.map(buildSubfeeling).sort((left, right) => left.sortOrder - right.sortOrder)
      : []

  if (profileCatalog) {
    console.info(`[storefront/profile] feelings_tree_ms=${Date.now() - t0}`)
  }

  return { feelings, subfeelings }
}

export async function listStorefrontFeelings(scope: MedusaContainer) {
  const root = await fetchProductCategoryByHandle(scope, FEELINGS_ROOT_HANDLE)
  if (root?.id) {
    const children = await fetchChildCategoriesOfParent(scope, root.id)
    const active = children.filter((category) => category.is_active !== false)
    if (active.length > 0) {
      return active.map((category) => buildFeeling(categoryToFeelingRecord(category)))
    }
  }

  return []
}

export async function retrieveStorefrontFeeling(scope: MedusaContainer, slug: string) {
  const root = await fetchProductCategoryByHandle(scope, FEELINGS_ROOT_HANDLE)
  if (root?.id) {
    const children = await fetchChildCategoriesOfParent(scope, root.id)
    const match = children.find((category) => category.handle === slug && category.is_active !== false)
    if (match) {
      return buildFeeling(categoryToFeelingRecord(match))
    }
  }

  return null
}

export async function listStorefrontSubfeelings(scope: MedusaContainer) {
  const root = await fetchProductCategoryByHandle(scope, FEELINGS_ROOT_HANDLE)
  if (root?.id) {
    const top = await fetchChildCategoriesOfParent(scope, root.id)
    const subRows: SubfeelingRecord[] = []

    for (const feeling of top) {
      if (!feeling.id || feeling.is_active === false) {
        continue
      }

      const subs = await fetchChildCategoriesOfParent(scope, feeling.id)
      for (const sub of subs) {
        if (sub.is_active === false || !sub.handle) {
          continue
        }

        subRows.push(categoryToSubfeelingRecord(sub, feeling.handle || ""))
      }
    }

    if (subRows.length > 0) {
      return subRows.map(buildSubfeeling).sort((left, right) => left.sortOrder - right.sortOrder)
    }
  }

  return []
}

export async function retrieveStorefrontSubfeeling(scope: MedusaContainer, slug: string) {
  const root = await fetchProductCategoryByHandle(scope, FEELINGS_ROOT_HANDLE)
  if (root?.id) {
    const top = await fetchChildCategoriesOfParent(scope, root.id)
    for (const feeling of top) {
      if (!feeling.id) {
        continue
      }

      const subs = await fetchChildCategoriesOfParent(scope, feeling.id)
      const match = subs.find((sub) => sub.handle === slug && sub.is_active !== false)
      if (match) {
        return buildSubfeeling(categoryToSubfeelingRecord(match, feeling.handle || ""))
      }
    }
  }

  return null
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
  const artists = await listStorefrontArtists(scope)
  const [products, feelingsBundle, occasions, events] = await Promise.all([
    listStorefrontProducts(scope, artists),
    loadFeelingsAndSubfeelingsForCatalog(scope),
    listStorefrontOccasions(scope),
    listStorefrontMerchEvents(scope),
  ])

  const { feelings, subfeelings } = feelingsBundle

  return {
    artists,
    events,
    feelings,
    occasions,
    products,
    subfeelings,
  }
}

let catalogServerCache: { expiresAt: number; value: StorefrontCatalogDTO } | null = null
let catalogServerInflight: Promise<StorefrontCatalogDTO> | null = null

/**
 * Same DTO as {@link buildStorefrontCatalog}, with optional in-process TTL (Phase 2).
 * Aligns with Next `revalidate: 60`: both can lag briefly after Admin edits unless you call
 * `revalidateTag` / restart workers. Set `STOREFRONT_CATALOG_SERVER_CACHE_MS=0` to disable.
 * Coalesces concurrent catalog builds onto one promise.
 */
export async function getStorefrontCatalogWithServerCache(
  scope: MedusaContainer
): Promise<StorefrontCatalogDTO> {
  const ttlMs = parsePositiveMsEnv("STOREFRONT_CATALOG_SERVER_CACHE_MS", DEFAULT_SERVER_CACHE_MS)
  if (ttlMs <= 0) {
    return buildStorefrontCatalog(scope)
  }

  const now = Date.now()
  if (catalogServerCache && catalogServerCache.expiresAt > now) {
    return catalogServerCache.value
  }

  if (catalogServerInflight) {
    return catalogServerInflight
  }

  catalogServerInflight = buildStorefrontCatalog(scope)
    .then((value) => {
      catalogServerCache = { expiresAt: Date.now() + ttlMs, value }
      return value
    })
    .finally(() => {
      catalogServerInflight = null
    })

  return catalogServerInflight
}
