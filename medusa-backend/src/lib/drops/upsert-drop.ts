import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules, ProductStatus } from "@medusajs/framework/utils"
import { DEFAULT_APPAREL_CATEGORY_PATH, GIFT_WRAP_HANDLE } from "../shared/constants"
import {
  batchLinkProductsToCategoryWorkflow,
  createInventoryLevelsWorkflow,
  createProductVariantsWorkflow,
  createProductsWorkflow,
  deleteProductVariantsWorkflow,
  updateInventoryLevelsWorkflow,
  updateProductsWorkflow,
  updateProductVariantsWorkflow,
} from "@medusajs/medusa/core-flows"

import { ARTIST_MODULE } from "../../modules/artist"
import type ArtistModuleService from "../../modules/artist/service"
import { OCCASION_MODULE } from "../../modules/occasion"
import type OccasionModuleService from "../../modules/occasion/service"
import { FEELINGS_ROOT_HANDLE } from "../storefront/feeling-category-metadata"
import {
  DEFAULT_DROP_SIZES,
  DEFAULT_DROP_TRUST_BADGES,
  type DropImageInput,
  type DropStatus,
  type ProductSizeKey,
  type UpsertDropPayload,
  type UpsertDropResult,
} from "./types"
import {
  assertValidDropPayload,
  mainDropImage,
  normalizeDropImages,
  normalizeDropSizes,
  normalizeDropStatus,
} from "./validate"
import { variantSize, type VariantRow } from "../inventory/stock-helpers"

type Query = {
  graph: (query: Record<string, unknown>) => Promise<{ data?: unknown }>
}

type CategoryRow = { id: string; handle: string; parent_category_id?: string | null }
type ProductCategoryRow = CategoryRow & {
  parent_category?: {
    handle?: string | null
    parent_category?: {
      handle?: string | null
    } | null
  } | null
}
type ProductRow = { id: string; handle: string; metadata?: Record<string, unknown> | null }
type StockLocationRow = { id: string; name?: string }


type InventoryLevelRow = {
  id: string
  inventory_item_id: string
  location_id: string
  stocked_quantity: number | null
}

function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function uniqueUrls(images: DropImageInput[]): string[] {
  return [...new Set(images.map((image) => image.url).filter(Boolean))]
}

function hasImageTag(images: DropImageInput[], tag: DropImageInput["tag"]): boolean {
  return images.some((image) => image.tag === tag && image.url?.trim())
}

async function resolveCategoryByPath(query: Query, categoryPath: string): Promise<string | null> {
  const handles = categoryPath.split("/").filter(Boolean)
  const leafHandle = handles[handles.length - 1]
  if (!leafHandle) return null

  const { data: rows } = await query.graph({
    entity: "product_category",
    fields: ["id", "handle"],
    filters: { handle: leafHandle },
  })

  const match = (rows as CategoryRow[] | undefined)?.[0]
  return match?.id ?? null
}

async function resolveFeelingCategory(
  query: Query,
  feelingSlug: string | undefined,
  subfeelingSlug: string | undefined,
): Promise<string | null> {
  for (const handle of [subfeelingSlug, feelingSlug]) {
    if (!handle) continue
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

function categoryIsUnderRoot(category: ProductCategoryRow, rootHandle: string): boolean {
  return [
    category.handle,
    category.parent_category?.handle,
    category.parent_category?.parent_category?.handle,
  ].includes(rootHandle)
}

async function productCategories(query: Query, productId: string): Promise<ProductCategoryRow[]> {
  const { data } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "categories.id",
      "categories.handle",
      "categories.parent_category_id",
      "categories.parent_category.handle",
      "categories.parent_category.parent_category.handle",
    ],
    filters: { id: productId },
  })

  const product = (data as Array<{ categories?: ProductCategoryRow[] }> | undefined)?.[0]
  return product?.categories ?? []
}

async function syncDropCategories(
  container: MedusaContainer,
  product: ProductRow,
  payload: UpsertDropPayload,
) {
  const query = container.resolve<Query>(ContainerRegistrationKeys.QUERY)
  const desiredIds = new Set<string>()

  if (payload.apparelCategory) {
    const categoryId = await resolveCategoryByPath(query, payload.apparelCategory)
    if (categoryId) desiredIds.add(categoryId)
  }

  const feelingCategoryId = await resolveFeelingCategory(query, payload.feeling, payload.subfeeling)
  if (feelingCategoryId) desiredIds.add(feelingCategoryId)

  const currentCategories = await productCategories(query, product.id)
  const managedCategoryIdsToRemove = currentCategories
    .filter((category) => {
      return (
        !desiredIds.has(category.id) &&
        (categoryIsUnderRoot(category, "apparel") || categoryIsUnderRoot(category, FEELINGS_ROOT_HANDLE))
      )
    })
    .map((category) => category.id)

  for (const categoryId of managedCategoryIdsToRemove) {
    await batchLinkProductsToCategoryWorkflow(container).run({
      input: { id: categoryId, add: [], remove: [product.id] },
    })
  }

  for (const categoryId of desiredIds) {
    await batchLinkProductsToCategoryWorkflow(container).run({
      input: { id: categoryId, add: [product.id], remove: [] },
    })
  }
}

async function ensureArtist(
  container: MedusaContainer,
  artistSlug: string | undefined,
): Promise<{ name: string; avatarUrl?: string } | undefined> {
  if (!artistSlug) return undefined

  const artistModuleService = container.resolve<ArtistModuleService>(ARTIST_MODULE)
  const existing = await artistModuleService.listArtists({ slug: [artistSlug] }) as Array<{
    id: string
    slug: string
    name: string
    avatar_src?: string | null
  }>

  if (existing.length) {
    const artist = existing[0]
    return {
      name: artist.name,
      ...(artist.avatar_src ? { avatarUrl: artist.avatar_src } : {}),
    }
  }

  const name = titleFromSlug(artistSlug)
  await artistModuleService.createArtists({
    active: true,
    name,
    slug: artistSlug,
    style: "TBD",
    design_count: 1,
    avatar_src: "",
  })

  return { name }
}

async function ensureOccasions(container: MedusaContainer, slugs: string[] | undefined) {
  if (!slugs?.length) return

  const occasionModuleService = container.resolve<OccasionModuleService>(OCCASION_MODULE)
  for (const slug of slugs) {
    const existing = await occasionModuleService.listOccasions({ slug }) as Array<{ id: string }>
    if (existing.length) continue

    await occasionModuleService.createOccasions({
      active: true,
      name: titleFromSlug(slug),
      slug,
      sort_order: 0,
    })
  }
}

function productStatusFromDrop(status: DropStatus): ProductStatus {
  return status === "published" ? ProductStatus.PUBLISHED : ProductStatus.DRAFT
}

export function buildDropMetadata(
  payload: UpsertDropPayload,
  status: DropStatus,
  sizes: ProductSizeKey[],
  images: DropImageInput[],
  artistMeta: { name: string; avatarUrl?: string } | undefined,
): Record<string, unknown> {
  const main = images.find((image) => image.tag === "main")?.url
  const gallery = images
    .filter((image) => image.tag !== "main")
    .map((image) => ({ url: image.url, tag: image.tag }))
  const hasLifestyleImage = hasImageTag(images, "lifestyle")
  const hasFlatLayImage = hasImageTag(images, "flat_lay")
  const hasProofFabricImage = hasImageTag(images, "proof_fabric")
  const hasProofPrintImage = hasImageTag(images, "proof_print")
  const hasProofWashImage = hasImageTag(images, "proof_wash")

  return {
    apparelCategoryPath: payload.apparelCategory ?? DEFAULT_APPAREL_CATEGORY_PATH,
    artistSlug: payload.artist ?? "",
    ...(artistMeta ? { artist: artistMeta } : {}),
    artworkSlug: payload.handle,
    artistCreditApproved: payload.artistCreditApproved === true,
    artistPaymentModel: payload.artistPaymentModel ?? "unknown",
    artistRightsApproved: payload.artistRightsApproved === true,
    availableSizes: sizes,
    buyerRoute: payload.buyerRoute ?? null,
    capsuleSlugs: payload.capsuleSlugs ?? [],
    catalogOrder: 0,
    complementarySlugs: payload.complementarySlugs ?? [],
    conceptApprovedAt: payload.conceptApprovedAt ?? null,
    customersAlsoBoughtSlugs: payload.customersAlsoBoughtSlugs ?? [],
    decorationType: payload.decorationType ?? "graphic",
    feelingSlug: payload.feeling ?? "",
    firstWedgeEligible: payload.firstWedgeEligible === true,
    fitLabel: payload.fitLabel,
    frequentlyBoughtWithSlugs: payload.frequentlyBoughtWithSlugs ?? [],
    garmentColors: payload.garmentColor ? [payload.garmentColor] : [],
    giftOccasionTags: payload.giftOccasionTags ?? [],
    giftable: payload.giftable === true,
    hasFlatLayImage,
    hasLifestyleImage,
    hasProofFabricImage,
    hasProofPrintImage,
    hasProofWashImage,
    media: {
      ...(main ? { main } : {}),
      gallery,
    },
    merchandisingBadge: payload.merchandisingBadge,
    mockupApprovedAt: payload.mockupApprovedAt ?? null,
    occasionSlugs: payload.occasions ?? [],
    primaryOccasionSlug: payload.occasions?.[0] ?? null,
    primaryAudience: payload.primaryAudience ?? null,
    priceEgp: payload.priceEgp,
    printReadyApprovedAt: payload.printReadyApprovedAt ?? null,
    productPhotosApproved: payload.productPhotosApproved === true,
    samplePrintApproved: payload.samplePrintApproved === true,
    samplePrintApprovedAt: payload.samplePrintApprovedAt ?? null,
    sketchApprovedAt: payload.sketchApprovedAt ?? null,
    sizeTableKey: payload.sizeTableKey,
    stockNote: payload.stockNote,
    story: payload.story ?? "",
    trustBadges: payload.trustBadges?.length ? payload.trustBadges : [...DEFAULT_DROP_TRUST_BADGES],
    usageScope: payload.usageScope ?? null,
    archived: status === "archived",
    ...(payload.launchAt ? { launchAt: payload.launchAt } : {}),
    ...(payload.sunsetAt ? { sunsetAt: payload.sunsetAt } : {}),
    ...(payload.originalPriceEgp ? { originalPriceEgp: payload.originalPriceEgp } : {}),
  }
}

async function findProductByHandle(query: Query, handle: string): Promise<ProductRow | undefined> {
  const { data } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "metadata"],
    filters: { handle },
  })
  return (data as ProductRow[] | undefined)?.[0]
}

function skuForSize(handle: string, size: ProductSizeKey) {
  return `${handle.toUpperCase()}-${size}`
}



async function listVariantsForDrop(
  container: MedusaContainer,
  product: ProductRow,
) {
  const query = container.resolve<Query>(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "variant",
    fields: ["id", "title", "sku", "manage_inventory", "allow_backorder", "product.id", "product.handle"],
  })

  return ((data as VariantRow[] | undefined) ?? []).filter((variant) => {
    return variant.product?.id === product.id || variant.product?.handle === product.handle
  })
}

async function syncVariantsForDrop(
  container: MedusaContainer,
  product: ProductRow,
  payload: UpsertDropPayload,
  sizes: ProductSizeKey[],
) {
  const shouldTrackInventory = Boolean(payload.stockPerSize)
  const selectedSizes = new Set<ProductSizeKey>(sizes)
  const variants = await listVariantsForDrop(container, product)
  const bySize = new Map<ProductSizeKey, VariantRow>()
  const idsToDelete: string[] = []

  for (const variant of variants) {
    const size = variantSize(variant) as ProductSizeKey | undefined
    if (!size) continue

    if (!selectedSizes.has(size)) {
      idsToDelete.push(variant.id)
      continue
    }

    if (bySize.has(size)) {
      idsToDelete.push(variant.id)
      continue
    }

    bySize.set(size, variant)
  }

  const existingUpdates = sizes
    .map((size) => {
      const variant = bySize.get(size)
      if (!variant) return null

      return {
        id: variant.id,
        title: size,
        sku: skuForSize(payload.handle, size),
        options: { Size: size },
        manage_inventory: shouldTrackInventory,
        allow_backorder: !shouldTrackInventory,
        ...(payload.priceEgp !== undefined
          ? { prices: [{ amount: payload.priceEgp, currency_code: "egp" }] }
          : {}),
      }
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))

  if (existingUpdates.length) {
    await updateProductVariantsWorkflow(container).run({
      input: { product_variants: existingUpdates },
    })
  }

  const missingSizes = sizes.filter((size) => !bySize.has(size))
  if (missingSizes.length) {
    await createProductVariantsWorkflow(container).run({
      input: {
        product_variants: missingSizes.map((size) => ({
          product_id: product.id,
          title: size,
          sku: skuForSize(payload.handle, size),
          options: { Size: size },
          manage_inventory: shouldTrackInventory,
          allow_backorder: !shouldTrackInventory,
          prices: [{ amount: payload.priceEgp ?? 1, currency_code: "egp" }],
        })),
      },
    })
  }

  if (idsToDelete.length) {
    await deleteProductVariantsWorkflow(container).run({
      input: { ids: idsToDelete },
    })
  }
}

async function ensureStockForDrop(
  container: MedusaContainer,
  handle: string,
  stockPerSize: Partial<Record<ProductSizeKey, number>>,
) {
  const query = container.resolve<Query>(ContainerRegistrationKeys.QUERY)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const stockLocationModule = container.resolve(Modules.STOCK_LOCATION)
  const stockLocations = (await stockLocationModule.listStockLocations({})) as StockLocationRow[]
  const stockLocation = stockLocations[0]
  if (!stockLocation) {
    throw new Error("No stock locations exist. Create one before publishing stock-tracked drops.")
  }

  const getVariants = async () => {
    const { data } = await query.graph({
      entity: "variant",
      fields: [
        "id",
        "title",
        "sku",
        "manage_inventory",
        "allow_backorder",
        "product.handle",
        "inventory_items.inventory.id",
        "inventory_items.inventory_item_id",
      ],
    })

    return ((data as VariantRow[] | undefined) ?? []).filter((variant) => {
      const productHandle = variant.product?.handle ?? ""
      return productHandle === handle && productHandle !== GIFT_WRAP_HANDLE
    })
  }

  let variants = await getVariants()
  const needsFlagFlip = variants.filter(
    (variant) => !variant.manage_inventory || variant.allow_backorder !== false,
  )

  if (needsFlagFlip.length) {
    await updateProductVariantsWorkflow(container).run({
      input: {
        selector: { id: needsFlagFlip.map((variant) => variant.id) },
        update: { manage_inventory: true, allow_backorder: false },
      },
    })
    variants = await getVariants()
  }

  const missingInventoryItem = variants.filter((variant) => {
    return !variant.inventory_items?.some((item) => item.inventory?.id ?? item.inventory_item_id)
  })

  if (missingInventoryItem.length) {
    const inventoryModule = container.resolve<{
      createInventoryItems: (input: Array<{ sku?: string }>) => Promise<Array<{ id: string; sku?: string | null }>>
      listInventoryItems: (
        filter: Record<string, unknown>,
        config?: Record<string, unknown>,
      ) => Promise<Array<{ id: string; sku?: string | null }>>
    }>(Modules.INVENTORY)
    const link = container.resolve<{ create: (input: Record<string, unknown>) => Promise<unknown> }>(
      ContainerRegistrationKeys.LINK,
    )

    const skus = missingInventoryItem.map((variant) => variant.sku).filter(Boolean) as string[]
    const existingItems = skus.length
      ? await inventoryModule.listInventoryItems({ sku: skus }, { take: skus.length })
      : []
    const existingBySku = new Map(existingItems.map((item) => [item.sku, item.id]))
    const newItemIdByVariantId = new Map<string, string>()
    const toCreate = missingInventoryItem.filter((variant) => {
      const existingId = variant.sku ? existingBySku.get(variant.sku) : undefined
      if (existingId) {
        newItemIdByVariantId.set(variant.id, existingId)
        return false
      }
      return true
    })

    if (toCreate.length) {
      const items = await inventoryModule.createInventoryItems(
        toCreate.map((variant) => ({ sku: variant.sku ?? undefined })),
      )
      for (let index = 0; index < toCreate.length; index++) {
        newItemIdByVariantId.set(toCreate[index].id, items[index].id)
      }
    }

    for (const [variantId, itemId] of newItemIdByVariantId.entries()) {
      try {
        await link.create({
          [Modules.PRODUCT]: { variant_id: variantId },
          [Modules.INVENTORY]: { inventory_item_id: itemId },
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : ""
        if (!/(already exists|already linked|duplicate)/i.test(message)) {
          throw error
        }
      }
    }

    variants = await getVariants()
  }

  const quantityByInventoryItemId = new Map<string, number>()
  const inventoryItemIds: string[] = []

  for (const variant of variants) {
    const size = variantSize(variant) as ProductSizeKey | undefined
    if (!size) continue
    const qty = stockPerSize[size]
    if (qty === undefined) continue

    for (const item of variant.inventory_items ?? []) {
      const itemId = item.inventory?.id ?? item.inventory_item_id
      if (!itemId) continue
      inventoryItemIds.push(itemId)
      quantityByInventoryItemId.set(itemId, qty)
    }
  }

  if (!inventoryItemIds.length) {
    logger.warn(`No inventory items found for drop ${handle}; stock levels were not seeded.`)
    return
  }

  const { data: existingLevels } = await query.graph({
    entity: "inventory_level",
    fields: ["id", "inventory_item_id", "location_id", "stocked_quantity"],
    filters: {
      inventory_item_id: inventoryItemIds,
      location_id: [stockLocation.id],
    },
  })

  const existingByItemId = new Map<string, InventoryLevelRow>()
  for (const level of (existingLevels as InventoryLevelRow[] | undefined) ?? []) {
    existingByItemId.set(level.inventory_item_id, level)
  }

  const toCreate: { inventory_item_id: string; location_id: string; stocked_quantity: number }[] = []
  const toUpdate: { id: string; inventory_item_id: string; location_id: string; stocked_quantity: number }[] = []

  for (const itemId of inventoryItemIds) {
    const stockedQuantity = quantityByInventoryItemId.get(itemId) ?? 0
    const existing = existingByItemId.get(itemId)
    if (!existing) {
      toCreate.push({
        inventory_item_id: itemId,
        location_id: stockLocation.id,
        stocked_quantity: stockedQuantity,
      })
    } else if ((existing.stocked_quantity ?? 0) !== stockedQuantity) {
      toUpdate.push({
        id: existing.id,
        inventory_item_id: existing.inventory_item_id,
        location_id: existing.location_id,
        stocked_quantity: stockedQuantity,
      })
    }
  }

  if (toCreate.length) {
    await createInventoryLevelsWorkflow(container).run({
      input: { inventory_levels: toCreate },
    })
  }

  if (toUpdate.length) {
    await updateInventoryLevelsWorkflow(container).run({
      input: { updates: toUpdate },
    })
  }
}

export async function upsertDrop(
  container: MedusaContainer,
  payload: UpsertDropPayload,
  options: { existingHandle?: string } = {},
): Promise<UpsertDropResult> {
  assertValidDropPayload(payload)

  const query = container.resolve<Query>(ContainerRegistrationKeys.QUERY)
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL)
  const status = normalizeDropStatus(payload.status)
  const sizes = normalizeDropSizes(payload.sizes)
  const images = normalizeDropImages(payload)
  const mainImageUrl = mainDropImage(payload)?.url
  const imageUrls = uniqueUrls(images)
  const artistMeta = await ensureArtist(container, payload.artist)

  await ensureOccasions(container, payload.occasions)

  const defaultSalesChannel = await salesChannelModuleService.listSalesChannels({
    name: "Default Sales Channel",
  })
  const salesChannelId = defaultSalesChannel[0]?.id

  if (!salesChannelId) {
    throw new Error("No Default Sales Channel found. Run seed-egypt-catalog first.")
  }

  const metadata = buildDropMetadata(payload, status, sizes, images, artistMeta)
  const existingProduct = await findProductByHandle(query, options.existingHandle ?? payload.handle)
  const description = payload.description?.trim() || payload.story?.trim() || ""

  if (existingProduct) {
    await updateProductsWorkflow(container).run({
      input: {
        selector: { id: existingProduct.id },
        update: {
          title: payload.title,
          handle: payload.handle,
          description,
          status: productStatusFromDrop(status),
          metadata,
          ...(imageUrls.length ? { images: imageUrls.map((url) => ({ url })) } : {}),
          ...(mainImageUrl ? { thumbnail: mainImageUrl } : {}),
        },
      },
    })
  } else {
    await createProductsWorkflow(container).run({
      input: {
        products: [
          {
            title: payload.title,
            handle: payload.handle,
            description,
            status: productStatusFromDrop(status),
            metadata,
            images: imageUrls.map((url) => ({ url })),
            ...(mainImageUrl ? { thumbnail: mainImageUrl } : {}),
            options: [{ title: "Size", values: [...sizes] }],
            variants: sizes.map((size) => ({
              title: size,
              sku: skuForSize(payload.handle, size),
              options: { Size: size },
              manage_inventory: Boolean(payload.stockPerSize),
              allow_backorder: !payload.stockPerSize,
              prices: [{ amount: payload.priceEgp ?? 1, currency_code: "egp" }],
            })),
            sales_channels: [{ id: salesChannelId }],
          },
        ],
      },
    })
  }

  const product = await findProductByHandle(query, payload.handle)
  if (!product?.id) {
    throw new Error(`Failed to resolve product after upserting ${payload.handle}.`)
  }

  await syncVariantsForDrop(container, product, payload, sizes)

  await syncDropCategories(container, product, payload)

  if (payload.stockPerSize) {
    await ensureStockForDrop(container, payload.handle, payload.stockPerSize)
  }

  return {
    id: product.id,
    handle: payload.handle,
    status,
    created: !existingProduct,
  }
}
