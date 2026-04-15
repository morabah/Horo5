import type { ExecArgs } from "@medusajs/framework/types"

/**
 * Out-of-band hook: run via `npx medusa exec ./src/scripts/sync-promo-labels-placeholder.ts`
 * when you want to sync `product.metadata.promoLabel` from Medusa Promotions or an external sheet.
 * Default implementation is a no-op so deploys stay safe until you wire PromotionModuleService.
 */
export default async function syncPromoLabelsPlaceholder(_args: ExecArgs) {
  /* intentionally empty */
}
