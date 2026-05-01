/**
 * Enable real stock tracking on HORO product variants.
 *
 * WHY THIS EXISTS
 * ---------------
 * `seed-egypt-catalog.ts` creates HORO variants with `manage_inventory: false`
 * and `allow_backorder: true`. With those flags Medusa V2 will:
 *   - NOT decrement stock when `POST /store/carts/:id/complete` succeeds, AND
 *   - NOT restore stock when an order is canceled or returned.
 *
 * Once you flip `manage_inventory: true` AND create at least one inventory
 * level for each variant, Medusa's built-in workflows take over and become the
 * single source of truth for stock:
 *   - `completeCartWorkflow` calls `reserveInventoryStep`, which creates a
 *     reservation against the variant's inventory level. The storefront's
 *     `storefront/catalog.ts` already reads `stocked_quantity - reserved_quantity`
 *     so the next catalog read shows the new available count.
 *   - `confirmReturnRequestWorkflow` calls `adjustInventoryLevelsWorkflow` to
 *     add returned units back to `stocked_quantity` automatically.
 *   - `cancelOrderWorkflow` releases reservations (the units never actually
 *     left the available pool).
 *
 * The storefront's optimistic stock check in `productStock.ts` then becomes a
 * UX guard ("Only 2 left") that matches what the server enforces.
 *
 * USAGE
 * -----
 *   # Stock everything to a flat default (e.g. 50 units per size at the
 *   # default location):
 *   npx medusa exec ./src/scripts/enable-variant-stock-tracking.ts 50
 *
 *   # Dry-run (no writes, just prints what WOULD change):
 *   npx medusa exec ./src/scripts/enable-variant-stock-tracking.ts 50 --dry-run
 *
 *   # Stock everything to 0 (sold-out preorder; combine with allow_backorder
 *   # in `seed-egypt-catalog.ts` if you want preorder semantics):
 *   npx medusa exec ./src/scripts/enable-variant-stock-tracking.ts 0
 *
 * The script is idempotent — running it twice with the same arg is safe; the
 * second run is a no-op for variants whose flags already match. Inventory
 * levels are upserted (created if missing, updated if present).
 *
 * EXCLUSIONS
 * ----------
 * Variants whose product is the gift-wrap product (handle = "gift-wrap") are
 * skipped — gift-wrap is a service add-on, not a physical SKU.
 */

import type { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import {
  createInventoryLevelsWorkflow,
  updateInventoryLevelsWorkflow,
  updateProductVariantsWorkflow,
} from "@medusajs/medusa/core-flows";

import { GIFT_WRAP_HANDLE } from "../lib/shared/constants";
import { normalizeArgs, readOption } from "../lib/shared/cli-args";
import {
  type StockMap,
  type StockLocationRow,
  type VariantRow,
  type InventoryLevelRow,
  parseDefaultQty,
  parseStockMap,
  resolveStoreDefaultStockQty,
  stockQtyForVariant,
} from "../lib/inventory/stock-helpers";

export type StockTrackingOptions = {
  defaultQty?: number;
  dryRun?: boolean;
  stockMap?: StockMap;
};

export type StockTrackingResult = {
  summary: string;
  details: {
    dryRun: boolean;
    defaultQty: number;
    totalVariants: number;
    needsFlagFlip: number;
    alreadyTracked: number;
    skipped: number;
    inventoryItemsTargeted: number;
    levelsToCreate: number;
    levelsToUpdate: number;
  };
};

export async function runEnableVariantStockTracking(
  container: ExecArgs["container"],
  options: StockTrackingOptions = {},
): Promise<StockTrackingResult> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const stockLocationModule = container.resolve(Modules.STOCK_LOCATION);

  const dryRun = Boolean(options.dryRun);
  const defaultQty = options.defaultQty ?? 50;
  const stockMap = options.stockMap;
  const scopedHandles = stockMap ? new Set(Object.keys(stockMap)) : undefined;

  logger.info(
    `enable-variant-stock-tracking: defaultQty=${defaultQty}${scopedHandles?.size ? `, stockMapHandles=${scopedHandles.size}` : ""}${dryRun ? " (DRY RUN)" : ""}`,
  );

  // 1) Resolve the default stock location. If multiple exist, the script
  //    operates on the first one — adjust if you need multi-location seeding.
  const stockLocations = (await stockLocationModule.listStockLocations({})) as StockLocationRow[];
  if (stockLocations.length === 0) {
    throw new Error(
      "No stock locations exist. Create one via Medusa admin or `seed.ts` before running this script.",
    );
  }
  const stockLocation = stockLocations[0];
  logger.info(`Using stock location: ${stockLocation.name ?? "(unnamed)"} (${stockLocation.id})`);

  // 2) List every variant and split by what work each one needs.
  const { data: variants } = (await query.graph({
    entity: "variant",
    fields: [
      "id",
      "title",
      "sku",
      "manage_inventory",
      "allow_backorder",
      "product.id",
      "product.handle",
      "inventory_items.inventory.id",
      "inventory_items.inventory_item_id",
    ],
  })) as { data: VariantRow[] };

  const skipped: VariantRow[] = [];
  const needsFlagFlip: VariantRow[] = [];
  const alreadyTracked: VariantRow[] = [];

  for (const variant of variants) {
    const handle = variant.product?.handle ?? "";
    if (!variant.product || handle === GIFT_WRAP_HANDLE) {
      skipped.push(variant);
      continue;
    }
    if (scopedHandles?.size && !scopedHandles.has(handle)) {
      skipped.push(variant);
      continue;
    }
    if (variant.manage_inventory && variant.allow_backorder === false) {
      alreadyTracked.push(variant);
    } else {
      needsFlagFlip.push(variant);
    }
  }

  logger.info(
    `Variants: total=${variants.length}, needs-flip=${needsFlagFlip.length}, already-tracked=${alreadyTracked.length}, skipped=${skipped.length} (gift-wrap / no product)`,
  );

  // 3) Flip `manage_inventory: true` + `allow_backorder: false` on the variants
  //    that still need it. Medusa creates the backing `inventory_item` rows
  //    automatically when this flag flips — that's why we re-query afterwards.
  if (needsFlagFlip.length > 0 && !dryRun) {
    await updateProductVariantsWorkflow(container).run({
      input: {
        selector: { id: needsFlagFlip.map((v) => v.id) },
        update: { manage_inventory: true, allow_backorder: false },
      },
    });
    logger.info(`Flipped manage_inventory:true / allow_backorder:false on ${needsFlagFlip.length} variant(s).`);
  }

  // 4) Re-query so we see the freshly-created `inventory_item` ids on the
  //    variants we just updated.
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
  })) as { data: VariantRow[] };

  const targetInventoryItemIds: string[] = [];
  const quantityByInventoryItemId = new Map<string, number>();
  for (const variant of refreshedVariants) {
    const handle = variant.product?.handle ?? "";
    if (!variant.product || handle === GIFT_WRAP_HANDLE) continue;
    if (scopedHandles?.size && !scopedHandles.has(handle)) continue;
    if (!variant.manage_inventory) continue;
    const stockedQuantity = stockQtyForVariant(variant, defaultQty, stockMap);
    if (stockedQuantity === undefined) continue;
    for (const link of variant.inventory_items ?? []) {
      const itemId = link.inventory?.id ?? link.inventory_item_id ?? null;
      if (!itemId) continue;
      targetInventoryItemIds.push(itemId);
      quantityByInventoryItemId.set(itemId, stockedQuantity);
    }
  }

  if (targetInventoryItemIds.length === 0) {
    logger.warn(
      "No inventory_items found for tracked variants. Did the flag flip succeed? (Re-run without --dry-run.)",
    );
    return {
      summary: "No inventory items found for tracked variants.",
      details: {
        dryRun,
        defaultQty,
        totalVariants: variants.length,
        needsFlagFlip: needsFlagFlip.length,
        alreadyTracked: alreadyTracked.length,
        skipped: skipped.length,
        inventoryItemsTargeted: 0,
        levelsToCreate: 0,
        levelsToUpdate: 0,
      },
    };
  }

  // 5) Read existing inventory levels at the chosen location so we can split
  //    "create" vs. "update" and stay idempotent.
  const { data: existingLevels } = (await query.graph({
    entity: "inventory_level",
    fields: ["id", "inventory_item_id", "location_id", "stocked_quantity"],
    filters: {
      inventory_item_id: targetInventoryItemIds,
      location_id: [stockLocation.id],
    },
  })) as { data: InventoryLevelRow[] };

  const existingByInventoryItem = new Map<string, InventoryLevelRow>();
  for (const lvl of existingLevels) {
    existingByInventoryItem.set(lvl.inventory_item_id, lvl);
  }

  const toCreate: { inventory_item_id: string; location_id: string; stocked_quantity: number }[] = [];
  const toUpdate: {
    id: string;
    inventory_item_id: string;
    location_id: string;
    stocked_quantity: number;
  }[] = [];

  for (const inventoryItemId of targetInventoryItemIds) {
    const existing = existingByInventoryItem.get(inventoryItemId);
    const stockedQuantity = quantityByInventoryItemId.get(inventoryItemId) ?? defaultQty;
    if (!existing) {
      toCreate.push({
        inventory_item_id: inventoryItemId,
        location_id: stockLocation.id,
        stocked_quantity: stockedQuantity,
      });
    } else if ((existing.stocked_quantity ?? 0) !== stockedQuantity) {
      toUpdate.push({
        id: existing.id,
        inventory_item_id: existing.inventory_item_id,
        location_id: existing.location_id,
        stocked_quantity: stockedQuantity,
      });
    }
  }

  logger.info(
    `Inventory levels: create=${toCreate.length}, update=${toUpdate.length}, untouched=${existingLevels.length - toUpdate.length}`,
  );

  if (dryRun) {
    logger.info("Dry run complete — no writes performed.");
    return {
      summary: `Dry run: would flip ${needsFlagFlip.length} variant(s), create ${toCreate.length} level(s), and update ${toUpdate.length} level(s).`,
      details: {
        dryRun,
        defaultQty,
        totalVariants: variants.length,
        needsFlagFlip: needsFlagFlip.length,
        alreadyTracked: alreadyTracked.length,
        skipped: skipped.length,
        inventoryItemsTargeted: targetInventoryItemIds.length,
        levelsToCreate: toCreate.length,
        levelsToUpdate: toUpdate.length,
      },
    };
  }

  if (toCreate.length > 0) {
    await createInventoryLevelsWorkflow(container).run({
      input: { inventory_levels: toCreate },
    });
    logger.info(`Created ${toCreate.length} inventory level(s) at ${stockLocation.id}.`);
  }

  if (toUpdate.length > 0) {
    await updateInventoryLevelsWorkflow(container).run({
      input: { updates: toUpdate },
    });
    logger.info(`Updated stocked_quantity on ${toUpdate.length} existing level(s).`);
  }

  logger.info(
    "Done. From now on `completeCart` will reserve inventory for these variants and `confirmReturnRequest` will restore it. The storefront's `storefront/catalog.ts` already reads stocked_quantity - reserved_quantity, so PDPs and cart will reflect real availability on the next request.",
  );
  return {
    summary: `Enabled stock tracking for ${needsFlagFlip.length} variant(s); created ${toCreate.length} level(s), updated ${toUpdate.length} level(s).`,
    details: {
      dryRun,
      defaultQty,
      totalVariants: variants.length,
      needsFlagFlip: needsFlagFlip.length,
      alreadyTracked: alreadyTracked.length,
      skipped: skipped.length,
      inventoryItemsTargeted: targetInventoryItemIds.length,
      levelsToCreate: toCreate.length,
      levelsToUpdate: toUpdate.length,
    },
  };
}

export default async function enableVariantStockTracking({
  container,
  args,
}: ExecArgs) {
  const arr = normalizeArgs(args);
  const storeDefaultQty = await resolveStoreDefaultStockQty(container);
  await runEnableVariantStockTracking(container, {
    defaultQty: parseDefaultQty(arr, storeDefaultQty),
    dryRun: arr.includes("dryrun") || arr.includes("--dry-run"),
    stockMap: await parseStockMap(arr),
  });
}
