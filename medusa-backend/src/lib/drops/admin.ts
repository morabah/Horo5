import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

import { ARTIST_MODULE } from "../../modules/artist"
import type ArtistModuleService from "../../modules/artist/service"
import { FEELINGS_ROOT_HANDLE } from "../storefront/feeling-category-metadata"
import { listStorefrontOccasions } from "../storefront/catalog"
import {
  DEFAULT_DROP_SIZES,
  DROP_DECORATION_TYPES,
  type DropImageInput,
  type DropStatus,
  type ProductSizeKey,
  type UpsertDropPayload,
} from "./types"
import { asRecord, asString, asNumber, asStringArrayOrEmpty } from "../shared/type-guards"

type Query = {
  graph: (query: Record<string, unknown>) => Promise<{ data?: unknown; metadata?: { count?: number } }>
}

type QueryProduct = {
  id: string
  title: string
  handle: string
  status?: string
  thumbnail?: string | null
  description?: string | null
  updated_at?: string | Date | null
  metadata?: Record<string, unknown> | null
  images?: Array<{ url?: string | null }>
  categories?: CategoryRow[]
  variants?: VariantRow[]
}

type CategoryRow = {
  id: string
  name?: string | null
  handle: string
  parent_category_id?: string | null
  rank?: number | null
  is_active?: boolean | null
  metadata?: Record<string, unknown> | null
  parent_category?: {
    id?: string
    handle?: string | null
    parent_category?: {
      id?: string
      handle?: string | null
    } | null
  } | null
}

type VariantRow = {
  id: string
  title?: string | null
  manage_inventory?: boolean | null
  prices?: Array<{ amount?: number | null; currency_code?: string | null }>
  inventory_items?: Array<{
    inventory?: {
      location_levels?: Array<{
        stocked_quantity?: number | null
        reserved_quantity?: number | null
      }>
    } | null
  }>
}

type DropListFilters = {
  q?: string
  status?: string
  feeling?: string
  occasion?: string
  limit?: number
  offset?: number
}

const PRODUCT_FIELDS = [
  "id",
  "title",
  "handle",
  "status",
  "thumbnail",
  "description",
  "updated_at",
  "metadata",
  "images.url",
  "categories.id",
  "categories.name",
  "categories.handle",
  "categories.parent_category_id",
  "categories.parent_category.id",
  "categories.parent_category.handle",
  "categories.parent_category.parent_category.id",
  "categories.parent_category.parent_category.handle",
  "variants.id",
  "variants.title",
  "variants.manage_inventory",
  "variants.prices.amount",
  "variants.prices.currency_code",
  "variants.inventory_items.inventory.location_levels.stocked_quantity",
  "variants.inventory_items.inventory.location_levels.reserved_quantity",
]

function statusFromProduct(product: QueryProduct): DropStatus {
  if (product.metadata?.archived === true) return "archived"
  return product.status === "published" ? "published" : "draft"
}

function priceFromProduct(product: QueryProduct): number | undefined {
  const metaPrice = asNumber(product.metadata?.priceEgp)
  if (metaPrice !== undefined) return metaPrice

  for (const variant of product.variants ?? []) {
    const egpPrice = variant.prices?.find((price) => price.currency_code === "egp")?.amount
    if (egpPrice !== undefined && egpPrice !== null) return Number(egpPrice)
  }

  return undefined
}

function variantStock(variant: VariantRow): number | null {
  if (!variant.manage_inventory) return null
  let total = 0
  for (const item of variant.inventory_items ?? []) {
    for (const level of item.inventory?.location_levels ?? []) {
      total += Number(level.stocked_quantity || 0) - Number(level.reserved_quantity || 0)
    }
  }
  return total
}

function stockPerSize(product: QueryProduct): Partial<Record<ProductSizeKey, number>> {
  const out: Partial<Record<ProductSizeKey, number>> = {}
  for (const variant of product.variants ?? []) {
    const size = variant.title?.toUpperCase() as ProductSizeKey | undefined
    if (!size || !DEFAULT_DROP_SIZES.includes(size)) continue
    const qty = variantStock(variant)
    if (qty !== null) out[size] = Math.max(0, qty)
  }
  return out
}

function totalStock(product: QueryProduct): number | null {
  let total = 0
  let hasTracked = false
  for (const variant of product.variants ?? []) {
    const qty = variantStock(variant)
    if (qty === null) continue
    hasTracked = true
    total += qty
  }
  return hasTracked ? Math.max(0, total) : null
}

function isDropProduct(product: QueryProduct): boolean {
  const metadata = product.metadata ?? {}
  return Boolean(metadata.artworkSlug || metadata.feelingSlug || metadata.media || metadata.story)
}

function categoryPathFromLeaf(category: CategoryRow): string {
  const grandparent = category.parent_category?.parent_category?.handle
  const parent = category.parent_category?.handle
  return [grandparent, parent, category.handle].filter(Boolean).join("/")
}

function subfeelingFromCategories(product: QueryProduct): string | undefined {
  const feelingSlug = asString(product.metadata?.feelingSlug)
  const explicit = asString(product.metadata?.primarySubfeelingSlug) || asString(product.metadata?.lineSlug)
  if (explicit) return explicit

  return product.categories?.find((category) => {
    return category.parent_category?.handle === feelingSlug
  })?.handle
}

function mediaImages(product: QueryProduct): DropImageInput[] {
  const media = asRecord(product.metadata?.media)
  const gallery = Array.isArray(media.gallery) ? media.gallery.map(asRecord) : []
  const images: DropImageInput[] = []
  const main = asString(media.main) || product.thumbnail || undefined

  if (main) {
    images.push({ url: main, tag: "main", order: 0 })
  }

  for (const [index, item] of gallery.entries()) {
    const url = asString(item.url)
    if (!url) continue
    images.push({
      url,
      tag: asString(item.tag) as DropImageInput["tag"],
      order: index + 1,
    })
  }

  for (const [index, image] of (product.images ?? []).entries()) {
    const url = image.url ?? undefined
    if (!url || images.some((item) => item.url === url)) continue
    images.push({ url, tag: index === 0 && !main ? "main" : "lifestyle", order: images.length })
  }

  return images
}

function productToPayload(product: QueryProduct): UpsertDropPayload & { id: string; updatedAt?: string | null } {
  const metadata = product.metadata ?? {}
  const garmentColors = asStringArrayOrEmpty(metadata.garmentColors)
  const sizes = asStringArrayOrEmpty(metadata.availableSizes).filter((size): size is ProductSizeKey => {
    return DEFAULT_DROP_SIZES.includes(size as ProductSizeKey)
  })

  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    status: statusFromProduct(product),
    story: asString(metadata.story) ?? "",
    description: product.description ?? "",
    feeling: asString(metadata.feelingSlug),
    subfeeling: subfeelingFromCategories(product),
    occasions: asStringArrayOrEmpty(metadata.occasionSlugs),
    apparelCategory: asString(metadata.apparelCategoryPath),
    priceEgp: priceFromProduct(product),
    originalPriceEgp: asNumber(metadata.originalPriceEgp) ?? null,
    sizes: sizes.length ? sizes : [...DEFAULT_DROP_SIZES],
    stockPerSize: stockPerSize(product),
    garmentColor: garmentColors[0],
    artist: asString(metadata.artistSlug),
    decorationType: asString(metadata.decorationType) as UpsertDropPayload["decorationType"],
    fitLabel: asString(metadata.fitLabel),
    trustBadges: asStringArrayOrEmpty(metadata.trustBadges),
    merchandisingBadge: asString(metadata.merchandisingBadge),
    stockNote: asString(metadata.stockNote),
    sizeTableKey: asString(metadata.sizeTableKey),
    hasLifestyleImage: metadata.hasLifestyleImage === true,
    hasFlatLayImage: metadata.hasFlatLayImage === true,
    hasProofFabricImage: metadata.hasProofFabricImage === true,
    hasProofPrintImage: metadata.hasProofPrintImage === true,
    hasProofWashImage: metadata.hasProofWashImage === true,
    samplePrintApproved: metadata.samplePrintApproved === true,
    productPhotosApproved: metadata.productPhotosApproved === true,
    artistRightsApproved: metadata.artistRightsApproved === true,
    artistCreditApproved: metadata.artistCreditApproved === true,
    usageScope: asString(metadata.usageScope) ?? null,
    artistPaymentModel: asString(metadata.artistPaymentModel) as UpsertDropPayload["artistPaymentModel"],
    conceptApprovedAt: asString(metadata.conceptApprovedAt),
    sketchApprovedAt: asString(metadata.sketchApprovedAt),
    mockupApprovedAt: asString(metadata.mockupApprovedAt),
    printReadyApprovedAt: asString(metadata.printReadyApprovedAt),
    samplePrintApprovedAt: asString(metadata.samplePrintApprovedAt),
    buyerRoute: asString(metadata.buyerRoute) as UpsertDropPayload["buyerRoute"],
    primaryAudience: asString(metadata.primaryAudience) as UpsertDropPayload["primaryAudience"],
    firstWedgeEligible: metadata.firstWedgeEligible === true,
    giftable: metadata.giftable === true,
    giftOccasionTags: asStringArrayOrEmpty(metadata.giftOccasionTags),
    images: mediaImages(product),
    capsuleSlugs: asStringArrayOrEmpty(metadata.capsuleSlugs),
    complementarySlugs: asStringArrayOrEmpty(metadata.complementarySlugs),
    frequentlyBoughtWithSlugs: asStringArrayOrEmpty(metadata.frequentlyBoughtWithSlugs),
    customersAlsoBoughtSlugs: asStringArrayOrEmpty(metadata.customersAlsoBoughtSlugs),
    launchAt: asString(metadata.launchAt),
    sunsetAt: asString(metadata.sunsetAt),
    updatedAt: product.updated_at ? new Date(product.updated_at).toISOString() : null,
  } as UpsertDropPayload & { id: string; updatedAt?: string | null }
}

function productToSummary(product: QueryProduct) {
  return {
    id: product.id,
    title: product.title,
    handle: product.handle,
    status: statusFromProduct(product),
    thumbnail: product.thumbnail ?? mediaImages(product)[0]?.url ?? null,
    feeling: asString(product.metadata?.feelingSlug) ?? "",
    occasionSlugs: asStringArrayOrEmpty(product.metadata?.occasionSlugs),
    priceEgp: priceFromProduct(product) ?? null,
    updatedAt: product.updated_at ? new Date(product.updated_at).toISOString() : null,
    variantCount: product.variants?.length ?? 0,
    totalStock: totalStock(product),
  }
}

export async function listAdminDrops(container: MedusaContainer, filters: DropListFilters = {}) {
  const query = container.resolve<Query>(ContainerRegistrationKeys.QUERY)
  const limit = Math.min(Math.max(filters.limit ?? 100, 1), 500)
  const offset = Math.max(filters.offset ?? 0, 0)
  const q = filters.q?.trim().toLowerCase()

  const { data } = await query.graph({
    entity: "product",
    fields: PRODUCT_FIELDS,
  })

  const all = ((data as QueryProduct[] | undefined) ?? [])
    .filter(isDropProduct)
    .filter((product) => {
      if (q) {
        const haystack = `${product.title} ${product.handle}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      const summary = productToSummary(product)
      if (filters.status && summary.status !== filters.status) return false
      if (filters.feeling && summary.feeling !== filters.feeling) return false
      if (filters.occasion && !summary.occasionSlugs.includes(filters.occasion)) return false
      return true
    })
    .sort((a, b) => {
      const aTime = a.updated_at ? new Date(a.updated_at).getTime() : 0
      const bTime = b.updated_at ? new Date(b.updated_at).getTime() : 0
      return bTime - aTime
    })

  return {
    drops: all.slice(offset, offset + limit).map(productToSummary),
    count: all.length,
    limit,
    offset,
  }
}

export async function getAdminDrop(container: MedusaContainer, handle: string) {
  const query = container.resolve<Query>(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "product",
    fields: PRODUCT_FIELDS,
    filters: { handle },
  })

  const product = ((data as QueryProduct[] | undefined) ?? [])[0]
  return product && isDropProduct(product) ? productToPayload(product) : null
}

function sortCategories(rows: CategoryRow[]): CategoryRow[] {
  return [...rows].sort((a, b) => {
    const rank = Number(a.rank ?? 0) - Number(b.rank ?? 0)
    if (rank !== 0) return rank
    return String(a.name ?? a.handle).localeCompare(String(b.name ?? b.handle))
  })
}

function buildApparelTree(rows: CategoryRow[]) {
  const root = rows.find((row) => row.handle === "apparel")
  if (!root) return []

  const childrenByParent = new Map<string, CategoryRow[]>()
  for (const row of rows) {
    if (!row.parent_category_id) continue
    const bucket = childrenByParent.get(row.parent_category_id) ?? []
    bucket.push(row)
    childrenByParent.set(row.parent_category_id, bucket)
  }

  const walk = (row: CategoryRow, prefix = ""): Array<{ id: string; name: string; handle: string; path: string; depth: number }> => {
    const path = prefix ? `${prefix}/${row.handle}` : row.handle
    const children = sortCategories(childrenByParent.get(row.id) ?? [])
    return [
      { id: row.id, name: row.name || row.handle, handle: row.handle, path, depth: path.split("/").length - 1 },
      ...children.flatMap((child) => walk(child, path)),
    ]
  }

  return walk(root)
}

export async function getAdminDropLookups(container: MedusaContainer) {
  const query = container.resolve<Query>(ContainerRegistrationKeys.QUERY)
  const artistService = container.resolve<ArtistModuleService>(ARTIST_MODULE)
  const storeModule = container.resolve(Modules.STORE)

  const [{ data: categoryData }, occasions, artists, stores] = await Promise.all([
    query.graph({
      entity: "product_category",
      fields: [
        "id",
        "name",
        "handle",
        "parent_category_id",
        "rank",
        "is_active",
        "metadata",
        "parent_category.id",
        "parent_category.handle",
      ],
    }),
    listStorefrontOccasions(container),
    artistService.listArtists({}),
    storeModule.listStores(),
  ])

  const categories = ((categoryData as CategoryRow[] | undefined) ?? []).filter((row) => row.is_active !== false)
  const feelingsRoot = categories.find((category) => category.handle === FEELINGS_ROOT_HANDLE)
  const feelings = feelingsRoot
    ? sortCategories(categories.filter((category) => category.parent_category_id === feelingsRoot.id)).map((category) => ({
      id: category.id,
      name: category.name || category.handle,
      slug: category.handle,
      accent: asString(category.metadata?.accent),
    }))
    : []
  const feelingIds = new Set(feelings.map((feeling) => feeling.id))
  const subfeelings = sortCategories(categories.filter((category) => feelingIds.has(category.parent_category_id ?? ""))).map((category) => ({
    id: category.id,
    name: category.name || category.handle,
    slug: category.handle,
    feelingSlug: category.parent_category?.handle ?? "",
  }))
  const fitLabels = new Set(["Regular fit", "Oversized", "Relaxed fit", "Boxy fit"])
  const store = stores[0] as { metadata?: Record<string, unknown> | null } | undefined
  const storeMetadata = store?.metadata ?? {}
  const sizeTables = asRecord(storeMetadata.sizeTables)

  return {
    feelings,
    subfeelings,
    occasions,
    artists: (artists as Array<{ id: string; slug: string; name: string; active?: boolean }>).filter((artist) => artist.active !== false),
    apparelCategories: buildApparelTree(categories),
    sizeTables: Object.keys(sizeTables),
    defaultSizeTableKey: asString(storeMetadata.defaultSizeTableKey) ?? null,
    decorationTypes: [...DROP_DECORATION_TYPES],
    fitLabels: [...fitLabels],
    sizes: [...DEFAULT_DROP_SIZES],
    storefrontUrl: asString(process.env.STORE_URL) || asString(storeMetadata.storefrontUrl) || null,
  }
}
