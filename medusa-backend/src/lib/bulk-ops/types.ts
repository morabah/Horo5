import type { ExecArgs } from "@medusajs/framework/types"

export type BulkOpActionId =
  | "round-egp-prices"
  | "link-shipping-profile"
  | "enable-stock-tracking"
  | "backfill-inventory"
  | "backfill-artist-metadata"
  | "rewrite-s3-urls"
  | "clear-occasion-slugs"
  | "update-incentive-threshold"

export type BulkOpOptions = {
  dryRun?: boolean
  occasionSlug?: string
  thresholdEgp?: number
}

export type BulkOpResult = {
  ok: boolean
  action: BulkOpActionId
  dryRun: boolean
  summary: string
  details?: unknown
  startedAt: string
  completedAt: string
}

export type BulkOpAction = {
  id: BulkOpActionId
  name: string
  description: string
  run: (container: ExecArgs["container"], options: BulkOpOptions) => Promise<{
    summary: string
    details?: unknown
  }>
}
