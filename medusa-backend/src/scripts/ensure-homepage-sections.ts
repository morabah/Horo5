/**
 * Create missing homepage_section rows from code defaults only.
 * Does not update existing rows (safe for production).
 *
 * Usage (from medusa-backend/):
 *   npm run ensure:homepage-sections
 */
import type { ExecArgs } from "@medusajs/framework/types"

import {
  DEFAULT_HOMEPAGE_SECTIONS,
  HOMEPAGE_SECTION_ORDER_BY_KEY,
  type HomepageSectionSeed,
} from "../lib/homepage-sections/defaults"
import { clearStorefrontHomepageCache } from "../lib/storefront/homepage"
import { HOMEPAGE_SECTION_MODULE } from "../modules/homepage-section"
import type HomepageSectionModuleService from "../modules/homepage-section/service"

type HomepageSectionWriteService = HomepageSectionModuleService & {
  createHomepageSections(input: HomepageSectionSeed[]): Promise<unknown>
  listHomepageSections(filters?: Record<string, unknown>): Promise<Array<{ id: string; key: string }>>
}

export default async function ensureHomepageSections({ container }: ExecArgs) {
  const service = container.resolve<HomepageSectionWriteService>(HOMEPAGE_SECTION_MODULE)
  const existing = await service.listHomepageSections({})
  const existingKeys = new Set(existing.map((section) => section.key))

  const launchKeys = new Set<string>(HOMEPAGE_SECTION_ORDER_BY_KEY)
  const toCreate = DEFAULT_HOMEPAGE_SECTIONS.filter(
    (section) => launchKeys.has(section.key) && !existingKeys.has(section.key),
  )

  if (toCreate.length > 0) {
    await service.createHomepageSections(toCreate)
    clearStorefrontHomepageCache()
  }

  // eslint-disable-next-line no-console
  console.info(
    `[ensure-homepage-sections] created=${toCreate.length} skipped=${existing.length} new_keys=${toCreate.map((s) => s.key).join(",") || "(none)"}`,
  )
}
