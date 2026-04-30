import type { ExecArgs } from "@medusajs/framework/types"

import { DEFAULT_HOMEPAGE_SECTIONS, type HomepageSectionSeed } from "../lib/homepage-sections/defaults"
import { HOMEPAGE_SECTION_MODULE } from "../modules/homepage-section"
import type HomepageSectionModuleService from "../modules/homepage-section/service"

type HomepageSectionWriteService = HomepageSectionModuleService & {
  createHomepageSections(input: HomepageSectionSeed[]): Promise<unknown>
  updateHomepageSections(input: Array<HomepageSectionSeed & { id: string }>): Promise<unknown>
}

export default async function seedHomepageSections({ container }: ExecArgs) {
  const service = container.resolve<HomepageSectionWriteService>(HOMEPAGE_SECTION_MODULE)
  const existing = (await service.listHomepageSections({})) as Array<{ id: string; key: string }>
  const byKey = new Map(existing.map((section) => [section.key, section]))

  const toCreate: HomepageSectionSeed[] = []
  const toUpdate: Array<HomepageSectionSeed & { id: string }> = []

  for (const section of DEFAULT_HOMEPAGE_SECTIONS) {
    const current = byKey.get(section.key)
    if (current) {
      toUpdate.push({ id: current.id, ...section })
    } else {
      toCreate.push(section)
    }
  }

  if (toCreate.length > 0) {
    await service.createHomepageSections(toCreate)
  }
  if (toUpdate.length > 0) {
    await service.updateHomepageSections(toUpdate)
  }

  // eslint-disable-next-line no-console
  console.info(
    `[seed-homepage-sections] created=${toCreate.length} updated=${toUpdate.length} keys=${DEFAULT_HOMEPAGE_SECTIONS.map((s) => s.key).join(",")}`,
  )
}
