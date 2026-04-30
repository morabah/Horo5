import type { BulkOpActionId } from "./types"

export type BulkOpActionDefinition = {
  id: BulkOpActionId
  name: string
  description: string
}

export const BULK_OP_ACTION_DEFINITIONS: BulkOpActionDefinition[] = [
  {
    id: "round-egp-prices",
    name: "Round EGP Prices",
    description: "Normalize EGP prices to whole-pound amounts and set EGP decimal_digits to 0.",
  },
  {
    id: "link-shipping-profile",
    name: "Link Shipping Profile",
    description: "Attach products missing a shipping profile to the default shipping profile.",
  },
  {
    id: "enable-stock-tracking",
    name: "Enable Stock Tracking",
    description: "Flip physical variants to tracked stock and create or update inventory levels.",
  },
  {
    id: "backfill-inventory",
    name: "Backfill Inventory",
    description: "Create missing inventory items and inventory levels for tracked variants.",
  },
  {
    id: "backfill-artist-metadata",
    name: "Backfill Artist Metadata",
    description: "Resolve product metadata.artist from metadata.artistSlug and storefront artists.",
  },
  {
    id: "rewrite-s3-urls",
    name: "Rewrite S3 URLs",
    description: "Rewrite direct object-storage URLs to the /store-media proxy URL.",
  },
  {
    id: "clear-occasion-slugs",
    name: "Clear Occasion Slugs",
    description: "Remove a specific occasion slug from all products' metadata.occasionSlugs and reassign primaryOccasionSlug.",
  },
  {
    id: "update-incentive-threshold",
    name: "Update Incentive Threshold",
    description: "Create or update the HORO_FREE_SHIPPING automatic promotion with a new EGP threshold.",
  },
]
