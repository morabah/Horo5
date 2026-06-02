/**
 * Sync homepage section sort_order and active flags from code defaults only.
 * Does not overwrite copy, CTAs, images, or payload.
 *
 * Usage (from medusa-backend/):
 *   npx medusa exec ./src/scripts/sync-homepage-section-order.ts
 */
import type { ExecArgs } from "@medusajs/framework/types"

import {
  DEFAULT_HOMEPAGE_SECTIONS,
  HOMEPAGE_SECTION_ORDER_BY_KEY,
} from "../lib/homepage-sections/defaults"
import { clearStorefrontHomepageCache } from "../lib/storefront/homepage"
import { HOMEPAGE_SECTION_MODULE } from "../modules/homepage-section"
import type HomepageSectionModuleService from "../modules/homepage-section/service"

type HomepageSectionRow = {
  id: string
  key: string
  sort_order?: number
  active?: boolean
}

type HomepageSectionWriteService = HomepageSectionModuleService & {
  listHomepageSections(filters?: Record<string, unknown>): Promise<HomepageSectionRow[]>
  updateHomepageSections(
    input: Array<{ id: string; sort_order: number; active: boolean }>,
  ): Promise<unknown>
}

export default async function syncHomepageSectionOrder({ container }: ExecArgs) {
  const service = container.resolve<HomepageSectionWriteService>(HOMEPAGE_SECTION_MODULE)
  const defaultsByKey = new Map(
    DEFAULT_HOMEPAGE_SECTIONS.map((section) => [section.key, section] as const),
  )
  const existing = await service.listHomepageSections({})
  const toUpdate: Array<{ id: string; sort_order: number; active: boolean }> = []

  for (const row of existing) {
    const def = defaultsByKey.get(row.key)
    if (!def) continue
    const nextActive = def.active !== false
    const nextSort = def.sort_order
    if (row.sort_order === nextSort && row.active === nextActive) continue
    toUpdate.push({ id: row.id, sort_order: nextSort, active: nextActive })
  }

  if (toUpdate.length > 0) {
    await service.updateHomepageSections(toUpdate)
    clearStorefrontHomepageCache()
  }

  // eslint-disable-next-line no-console
  console.info(
    `[sync-homepage-section-order] updated=${toUpdate.length} expected_active_order=${HOMEPAGE_SECTION_ORDER_BY_KEY.join(" → ")}`,
  )
}
