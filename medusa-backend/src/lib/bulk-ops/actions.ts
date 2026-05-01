import { revalidateStorefrontForDrop } from "../drops/revalidate-storefront"
import { resolveStoreDefaultStockQty } from "../inventory/stock-helpers"
import { runApplyEgpWholePoundPrices } from "../../scripts/apply-egp-whole-pound-prices"
import { runBackfillInventoryLevels } from "../../scripts/backfill-inventory-levels"
import { runBackfillProductArtistMetadata } from "../../scripts/backfill-product-artist-metadata"
import { runClearProductOccasionSlugs } from "../../scripts/clear-product-occasion-slug"
import { runEnableVariantStockTracking } from "../../scripts/enable-variant-stock-tracking"
import { runLinkProductsToShippingProfile } from "../../scripts/link-products-to-shipping-profile"
import { runRewriteStorageUrls } from "../../scripts/rewrite-storage-urls-to-store-media"
import { runUpdateIncentiveThreshold } from "../../scripts/seed-incentives"
import { BULK_OP_ACTION_DEFINITIONS } from "./definitions"
import type { BulkOpAction, BulkOpActionId, BulkOpOptions, BulkOpResult } from "./types"

const BULK_OP_RUNNERS: Record<BulkOpActionId, BulkOpAction["run"]> = {
  "round-egp-prices": async (_container, options) => runApplyEgpWholePoundPrices(options),
  "link-shipping-profile": runLinkProductsToShippingProfile,
  "enable-stock-tracking": async (container, options) => runEnableVariantStockTracking(container, {
    defaultQty: (await resolveStoreDefaultStockQty(container)) ?? 50,
    dryRun: options.dryRun,
  }),
  "backfill-inventory": async (container, options) => runBackfillInventoryLevels(container, {
    defaultQty: (await resolveStoreDefaultStockQty(container)) ?? 50,
    dryRun: options.dryRun,
  }),
  "backfill-artist-metadata": runBackfillProductArtistMetadata,
  "rewrite-s3-urls": async (_container, options) => runRewriteStorageUrls(options),
  "clear-occasion-slugs": async (container, options) => runClearProductOccasionSlugs(container, {
    occasionSlug: options.occasionSlug || "",
    dryRun: options.dryRun,
  }),
  "update-incentive-threshold": async (container, options) => runUpdateIncentiveThreshold(container, {
    thresholdEgp: options.thresholdEgp,
    dryRun: options.dryRun,
  }),
}

export const BULK_OP_ACTIONS: BulkOpAction[] = BULK_OP_ACTION_DEFINITIONS.map((definition) => ({
  ...definition,
  run: BULK_OP_RUNNERS[definition.id],
}))

export function listBulkOpActions() {
  return BULK_OP_ACTIONS.map(({ id, name, description }) => ({ id, name, description }))
}

export function getBulkOpAction(actionId: string): BulkOpAction | undefined {
  return BULK_OP_ACTIONS.find((action) => action.id === actionId)
}

export async function runBulkOpAction(
  actionId: BulkOpActionId,
  container: Parameters<BulkOpAction["run"]>[0],
  options: BulkOpOptions = {},
): Promise<BulkOpResult> {
  const action = getBulkOpAction(actionId)
  if (!action) {
    throw new Error(`Unknown bulk operation action: ${actionId}`)
  }

  const startedAt = new Date().toISOString()
  const dryRun = Boolean(options.dryRun)
  const output = await action.run(container, { ...options, dryRun })

  if (!dryRun) {
    revalidateStorefrontForDrop("*")
  }

  return {
    ok: true,
    action: action.id,
    dryRun,
    summary: output.summary,
    details: output.details,
    startedAt,
    completedAt: new Date().toISOString(),
  }
}
