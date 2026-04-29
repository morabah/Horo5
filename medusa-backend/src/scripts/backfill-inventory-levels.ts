/**
 * Backfill inventory items + levels for variants that have manage_inventory:true
 * but are missing the variant→inventory_item link and/or inventory level.
 *
 * WHY THIS EXISTS
 * ---------------
 * `enable-variant-stock-tracking.ts` flips `manage_inventory: true` on variants.
 * In Medusa V2, `updateProductVariantsWorkflow` is *supposed* to auto-create
 * the backing `inventory_item` + `product_variant_inventory_item` link, but on
 * some environments (e.g. Railway with in-memory event bus) the link creation
 * can silently fail, leaving variants in a broken state: tracked but no
 * inventory items or levels.
 *
 * This script detects that state and creates the missing pieces:
 *   1. An `inventory_item` per variant (with the variant's SKU)
 *   2. A `product_variant_inventory_item` link row
 *   3. An `inventory_level` at the default stock location
 *
 * It is idempotent — safe to run repeatedly.
 *
 * USAGE
 * -----
 *   npx medusa exec ./src/scripts/backfill-inventory-levels.ts 50
 *   npx medusa exec ./src/scripts/backfill-inventory-levels.ts 50 dryrun
 *   # Railway:
 *   DATABASE_PUBLIC_URL=... npm run backfill:inventory:public 50
 */

import type { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import {
  createInventoryLevelsWorkflow,
  updateInventoryLevelsWorkflow,
} from "@medusajs/medusa/core-flows"

const GIFT_WRAP_HANDLE = "gift-wrap"

type StockLocationRow = { id: string; name?: string }

type VariantRow = {
  id: string
  sku: string | null
  manage_inventory: boolean | null
  product?: { id: string; handle: string | null } | null
  inventory_items?: Array<{
    inventory?: { id: string } | null
    inventory_item_id?: string | null
  }>
}

type InventoryLevelRow = {
  id: string
  inventory_item_id: string
  location_id: string
  stocked_quantity: number | null
}

function parseDefaultQty(args: unknown): number {
  const arr = Array.isArray(args) ? args : []
  const positional = arr.find(
    (a) => typeof a === "string" && a !== "dryrun" && !a.startsWith("-"),
  )
  if (!positional) return 50
  const n = Number(positional)
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(`Invalid default quantity: ${positional}. Pass a non-negative integer.`)
  }
  return Math.floor(n)
}

export default async function backfillInventoryLevels({ container, args }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const inventoryModule = container.resolve<{
    createInventoryItems: (input: Array<{ sku?: string }>) => Promise<Array<{ id: string; sku?: string | null }>>
    listInventoryItems: (filter: Record<string, unknown>, config?: Record<string, unknown>) => Promise<Array<{ id: string; sku?: string | null }>>
  }>(Modules.INVENTORY)
  const link = container.resolve<{
    create: (input: Record<string, unknown>) => Promise<unknown>
    dismiss: (input: Record<string, unknown>) => Promise<unknown>
  }>(ContainerRegistrationKeys.LINK)
  const stockLocationModule = container.resolve(Modules.STOCK_LOCATION)

  const dryRun = Array.isArray(args) && args.includes("dryrun")
  const defaultQty = parseDefaultQty(args)

  logger.info(`backfill-inventory-levels: defaultQty=${defaultQty}${dryRun ? " (DRY RUN)" : ""}`)

  // 1) Resolve the default stock location.
  const stockLocations = (await stockLocationModule.listStockLocations({})) as StockLocationRow[]
  if (!stockLocations.length) {
    throw new Error("No stock locations exist. Run the seed first.")
  }
  const stockLocation = stockLocations[0]
  logger.info(`Using stock location: ${stockLocation.name ?? "(unnamed)"} (${stockLocation.id})`)

  // 2) List every variant with its inventory item links.
  const { data: variants } = (await query.graph({
    entity: "variant",
    fields: [
      "id",
      "sku",
      "manage_inventory",
      "product.id",
      "product.handle",
      "inventory_items.inventory.id",
      "inventory_items.inventory_item_id",
    ],
  })) as { data: VariantRow[] }

  // 3) Find tracked variants missing an inventory item link.
  const missingInventoryItem: VariantRow[] = []
  const hasInventoryItem: VariantRow[] = []

  for (const variant of variants) {
    const handle = variant.product?.handle ?? ""
    if (!variant.product || handle === GIFT_WRAP_HANDLE) continue
    if (!variant.manage_inventory) continue

    const hasLink = variant.inventory_items?.some(
      (li) => li.inventory?.id ?? li.inventory_item_id,
    )
    if (hasLink) {
      hasInventoryItem.push(variant)
    } else {
      missingInventoryItem.push(variant)
    }
  }

  logger.info(
    `Tracked variants: with-inventory-item=${hasInventoryItem.length}, missing-inventory-item=${missingInventoryItem.length}`,
  )

  // 4) Create inventory items for variants that lack them.
  const newItemIdByVariantId = new Map<string, string>()

  if (missingInventoryItem.length > 0) {
    if (dryRun) {
      logger.info(
        `DRY RUN — would backfill ${missingInventoryItem.length} variant(s) missing inventory items.`,
      )
    } else {
      // Some variants may already have inventory items with matching SKUs that
      // just aren't linked. Find them first to avoid duplicate-SKU errors.
      const skus = missingInventoryItem.map((v) => v.sku).filter(Boolean) as string[]
      const existingBySku = new Map<string, string>()
      if (skus.length) {
        const existingItems = await inventoryModule.listInventoryItems(
          { sku: skus },
          { take: skus.length },
        )
        for (const item of existingItems) {
          if (item.sku) existingBySku.set(item.sku, item.id)
        }
        logger.info(`Found ${existingBySku.size} existing inventory item(s) by SKU that are unlinked.`)
      }

      const toCreate: VariantRow[] = []
      for (const variant of missingInventoryItem) {
        const existingId = variant.sku ? existingBySku.get(variant.sku) : undefined
        if (existingId) {
          newItemIdByVariantId.set(variant.id, existingId)
        } else {
          toCreate.push(variant)
        }
      }

      // Create inventory items for variants that have no matching SKU.
      if (toCreate.length > 0) {
        logger.info(`Creating ${toCreate.length} new inventory item(s)...`)
        const BATCH = 50
        for (let i = 0; i < toCreate.length; i += BATCH) {
          const batch = toCreate.slice(i, i + BATCH)
          const items = await inventoryModule.createInventoryItems(
            batch.map((v) => ({ sku: v.sku ?? undefined })),
          )
          for (let j = 0; j < batch.length; j++) {
            newItemIdByVariantId.set(batch[j].id, items[j].id)
          }
        }
        logger.info(`Created ${toCreate.length} new inventory item(s).`)
      }

      // Link all variant ↔ inventory_item (existing + new).
      logger.info(`Creating ${newItemIdByVariantId.size} variant↔inventory_item link(s)...`)
      let linked = 0
      for (const [variantId, itemId] of newItemIdByVariantId.entries()) {
        try {
          await link.create({
            [Modules.PRODUCT]: { variant_id: variantId },
            [Modules.INVENTORY]: { inventory_item_id: itemId },
          })
          linked++
        } catch (error) {
          const msg = error instanceof Error ? error.message : ""
          if (!/(already exists|already linked|duplicate)/i.test(msg)) {
            throw error
          }
        }
      }
      logger.info(`Linked ${linked} variant(s) to inventory item(s).`)
    }
  }

  if (dryRun && missingInventoryItem.length > 0) {
    return
  }

  // 5) Re-query to get all inventory item IDs (including newly created).
  const { data: refreshedVariants } = (await query.graph({
    entity: "variant",
    fields: [
      "id",
      "sku",
      "manage_inventory",
      "product.handle",
      "inventory_items.inventory.id",
      "inventory_items.inventory_item_id",
    ],
  })) as { data: VariantRow[] }

  const allInventoryItemIds: string[] = []
  for (const variant of refreshedVariants) {
    const handle = variant.product?.handle ?? ""
    if (!variant.product || handle === GIFT_WRAP_HANDLE) continue
    if (!variant.manage_inventory) continue
    for (const li of variant.inventory_items ?? []) {
      const itemId = li.inventory?.id ?? li.inventory_item_id
      if (itemId) allInventoryItemIds.push(itemId)
    }
  }

  if (!allInventoryItemIds.length) {
    logger.warn("No inventory items found for tracked variants — nothing to do for levels.")
    return
  }

  // 6) Check existing inventory levels at the stock location.
  const { data: existingLevels } = (await query.graph({
    entity: "inventory_level",
    fields: ["id", "inventory_item_id", "location_id", "stocked_quantity"],
    filters: {
      inventory_item_id: allInventoryItemIds,
      location_id: [stockLocation.id],
    },
  })) as { data: InventoryLevelRow[] }

  const existingByItemId = new Map<string, InventoryLevelRow>()
  for (const lvl of existingLevels) {
    existingByItemId.set(lvl.inventory_item_id, lvl)
  }

  const toCreate: { inventory_item_id: string; location_id: string; stocked_quantity: number }[] = []
  const toUpdate: { id: string; inventory_item_id: string; location_id: string; stocked_quantity: number }[] = []

  for (const itemId of allInventoryItemIds) {
    const existing = existingByItemId.get(itemId)
    if (!existing) {
      toCreate.push({
        inventory_item_id: itemId,
        location_id: stockLocation.id,
        stocked_quantity: defaultQty,
      })
    } else if ((existing.stocked_quantity ?? 0) !== defaultQty) {
      toUpdate.push({
        id: existing.id,
        inventory_item_id: existing.inventory_item_id,
        location_id: existing.location_id,
        stocked_quantity: defaultQty,
      })
    }
  }

  logger.info(
    `Inventory levels: create=${toCreate.length}, update=${toUpdate.length}, untouched=${existingLevels.length - toUpdate.length}`,
  )

  if (dryRun) {
    logger.info("Dry run complete — no writes performed.")
    return
  }

  if (toCreate.length > 0) {
    await createInventoryLevelsWorkflow(container).run({
      input: { inventory_levels: toCreate },
    })
    logger.info(`Created ${toCreate.length} inventory level(s) at ${stockLocation.id}.`)
  }

  if (toUpdate.length > 0) {
    await updateInventoryLevelsWorkflow(container).run({
      input: { updates: toUpdate },
    })
    logger.info(`Updated stocked_quantity on ${toUpdate.length} existing level(s).`)
  }

  logger.info("Done. All tracked variants now have inventory items + levels.")
}
