/**
 * Backfill inventory items + levels for variants that have manage_inventory:true
 * but are missing the variant->inventory_item link and/or inventory level.
 *
 * The legacy CLI behavior remains:
 *   npx medusa exec ./src/scripts/backfill-inventory-levels.ts 50
 *   npx medusa exec ./src/scripts/backfill-inventory-levels.ts 50 dryrun
 *
 * Catalog sync can also import this file and pass a per-product stock map so
 * backfilled levels use the same per-size quantities as the sheet.
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

import { GIFT_WRAP_HANDLE } from "../lib/shared/constants"
import { normalizeArgs } from "../lib/shared/cli-args"
import {
  type StockMap,
  type StockLocationRow,
  type VariantRow,
  type InventoryLevelRow,
  parseDefaultQty,
  parseStockMap,
  resolveStoreDefaultStockQty,
  stockQtyForVariant,
} from "../lib/inventory/stock-helpers"

export type BackfillInventoryOptions = {
  defaultQty?: number
  dryRun?: boolean
  stockMap?: StockMap
}

export type BackfillInventoryResult = {
  summary: string
  details: {
    dryRun: boolean
    defaultQty: number
    variantsWithInventoryItem: number
    variantsMissingInventoryItem: number
    inventoryItemsTargeted: number
    levelsToCreate: number
    levelsToUpdate: number
  }
}

export async function runBackfillInventoryLevels(
  container: ExecArgs["container"],
  options: BackfillInventoryOptions = {},
): Promise<BackfillInventoryResult> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const inventoryModule = container.resolve<{
    createInventoryItems: (input: Array<{ sku?: string }>) => Promise<Array<{ id: string; sku?: string | null }>>
    listInventoryItems: (
      filter: Record<string, unknown>,
      config?: Record<string, unknown>,
    ) => Promise<Array<{ id: string; sku?: string | null }>>
  }>(Modules.INVENTORY)
  const link = container.resolve<{
    create: (input: Record<string, unknown>) => Promise<unknown>
  }>(ContainerRegistrationKeys.LINK)
  const stockLocationModule = container.resolve(Modules.STOCK_LOCATION)

  const dryRun = Boolean(options.dryRun)
  const defaultQty = options.defaultQty ?? 50
  const stockMap = options.stockMap
  const scopedHandles = stockMap ? new Set(Object.keys(stockMap)) : undefined

  logger.info(
    `backfill-inventory-levels: defaultQty=${defaultQty}${scopedHandles?.size ? `, stockMapHandles=${scopedHandles.size}` : ""}${dryRun ? " (DRY RUN)" : ""}`,
  )

  const stockLocations = (await stockLocationModule.listStockLocations({})) as StockLocationRow[]
  if (!stockLocations.length) {
    throw new Error("No stock locations exist. Run the seed first.")
  }
  const stockLocation = stockLocations[0]
  logger.info(`Using stock location: ${stockLocation.name ?? "(unnamed)"} (${stockLocation.id})`)

  const { data: variants } = (await query.graph({
    entity: "variant",
    fields: [
      "id",
      "title",
      "sku",
      "manage_inventory",
      "product.id",
      "product.handle",
      "inventory_items.inventory.id",
      "inventory_items.inventory_item_id",
    ],
  })) as { data: VariantRow[] }

  const missingInventoryItem: VariantRow[] = []
  const hasInventoryItem: VariantRow[] = []

  for (const variant of variants) {
    const handle = variant.product?.handle ?? ""
    if (!variant.product || handle === GIFT_WRAP_HANDLE) continue
    if (scopedHandles?.size && !scopedHandles.has(handle)) continue
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

  const newItemIdByVariantId = new Map<string, string>()

  if (missingInventoryItem.length > 0) {
    if (dryRun) {
      logger.info(
        `DRY RUN - would backfill ${missingInventoryItem.length} variant(s) missing inventory items.`,
      )
    } else {
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

      logger.info(`Creating ${newItemIdByVariantId.size} variant->inventory_item link(s)...`)
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
    return {
      summary: `Dry run: would backfill ${missingInventoryItem.length} variant(s) missing inventory items.`,
      details: {
        dryRun,
        defaultQty,
        variantsWithInventoryItem: hasInventoryItem.length,
        variantsMissingInventoryItem: missingInventoryItem.length,
        inventoryItemsTargeted: 0,
        levelsToCreate: 0,
        levelsToUpdate: 0,
      },
    }
  }

  const { data: refreshedVariants } = (await query.graph({
    entity: "variant",
    fields: [
      "id",
      "title",
      "sku",
      "manage_inventory",
      "product.handle",
      "inventory_items.inventory.id",
      "inventory_items.inventory_item_id",
    ],
  })) as { data: VariantRow[] }

  const allInventoryItemIds: string[] = []
  const quantityByInventoryItemId = new Map<string, number>()
  for (const variant of refreshedVariants) {
    const handle = variant.product?.handle ?? ""
    if (!variant.product || handle === GIFT_WRAP_HANDLE) continue
    if (scopedHandles?.size && !scopedHandles.has(handle)) continue
    if (!variant.manage_inventory) continue
    const stockedQuantity = stockQtyForVariant(variant, defaultQty, stockMap)
    if (stockedQuantity === undefined) continue

    for (const li of variant.inventory_items ?? []) {
      const itemId = li.inventory?.id ?? li.inventory_item_id
      if (!itemId) continue
      allInventoryItemIds.push(itemId)
      quantityByInventoryItemId.set(itemId, stockedQuantity)
    }
  }

  if (!allInventoryItemIds.length) {
    logger.warn("No inventory items found for tracked variants - nothing to do for levels.")
    return {
      summary: "No inventory items found for tracked variants.",
      details: {
        dryRun,
        defaultQty,
        variantsWithInventoryItem: hasInventoryItem.length,
        variantsMissingInventoryItem: missingInventoryItem.length,
        inventoryItemsTargeted: 0,
        levelsToCreate: 0,
        levelsToUpdate: 0,
      },
    }
  }

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
    const stockedQuantity = quantityByInventoryItemId.get(itemId) ?? defaultQty
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

  logger.info(
    `Inventory levels: create=${toCreate.length}, update=${toUpdate.length}, untouched=${existingLevels.length - toUpdate.length}`,
  )

  if (dryRun) {
    logger.info("Dry run complete - no writes performed.")
    return {
      summary: `Dry run: would create ${toCreate.length} inventory level(s) and update ${toUpdate.length} level(s).`,
      details: {
        dryRun,
        defaultQty,
        variantsWithInventoryItem: hasInventoryItem.length,
        variantsMissingInventoryItem: missingInventoryItem.length,
        inventoryItemsTargeted: allInventoryItemIds.length,
        levelsToCreate: toCreate.length,
        levelsToUpdate: toUpdate.length,
      },
    }
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
  return {
    summary: `Backfilled inventory: created ${toCreate.length} level(s), updated ${toUpdate.length} level(s).`,
    details: {
      dryRun,
      defaultQty,
      variantsWithInventoryItem: hasInventoryItem.length,
      variantsMissingInventoryItem: missingInventoryItem.length,
      inventoryItemsTargeted: allInventoryItemIds.length,
      levelsToCreate: toCreate.length,
      levelsToUpdate: toUpdate.length,
    },
  }
}

export default async function backfillInventoryLevels({ container, args }: ExecArgs) {
  const arr = normalizeArgs(args)
  const storeDefaultQty = await resolveStoreDefaultStockQty(container)
  await runBackfillInventoryLevels(container, {
    defaultQty: parseDefaultQty(arr, storeDefaultQty),
    dryRun: arr.includes("dryrun") || arr.includes("--dry-run"),
    stockMap: await parseStockMap(arr),
  })
}
