/**
 * Updates active homepage hero sections that still use the legacy default image path.
 * Safe: only touches rows where image_src is exactly the legacy path (or empty).
 *
 * Usage (from medusa-backend/):
 *   npx medusa exec ./src/scripts/sync-homepage-hero-safe.ts
 */
import type { ExecArgs } from "@medusajs/framework/types"

import { clearStorefrontHomepageCache } from "../lib/storefront/homepage"
import { HOMEPAGE_SECTION_MODULE } from "../modules/homepage-section"
import type HomepageSectionModuleService from "../modules/homepage-section/service"

const LEGACY_HERO_PATH = "/images/heroes/home-hero.png"
const CURRENT_HERO_PATH = "/images/hero/home-hero-wear-feel.png"

type HomepageSectionRow = {
  id: string
  key: string
  image_src?: string | null
}

type HomepageSectionWriteService = HomepageSectionModuleService & {
  listHomepageSections(filters?: Record<string, unknown>): Promise<HomepageSectionRow[]>
  updateHomepageSections(
    input: Array<{ id: string; image_src: string }>,
  ): Promise<unknown>
}

export default async function syncHomepageHeroSafe({ container }: ExecArgs) {
  const service = container.resolve<HomepageSectionWriteService>(HOMEPAGE_SECTION_MODULE)
  const sections = await service.listHomepageSections({ key: "hero" })

  const toUpdate: Array<{ id: string; image_src: string }> = []
  for (const section of sections) {
    const src = section.image_src?.trim()
    if (src && src !== LEGACY_HERO_PATH) {
      continue
    }
    toUpdate.push({ id: section.id, image_src: CURRENT_HERO_PATH })
  }

  if (toUpdate.length > 0) {
    await service.updateHomepageSections(toUpdate)
    clearStorefrontHomepageCache()
  }

  console.log(
    `sync-homepage-hero-safe: updated ${toUpdate.length} hero section(s) to ${CURRENT_HERO_PATH}`,
  )
}
