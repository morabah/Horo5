/**
 * Safe-merge homepage rows toward image-led copy and presentation defaults.
 * - Updates EN/AR text only when it still matches a known legacy default string.
 * - Merges default presentation into existing partial presentation objects.
 * - Sets image_src only when empty (or legacy hero path).
 * - Sends minimal field patches to the update service.
 *
 * Usage (from medusa-backend/):
 *   npm run sync:homepage-image-led
 */
import type { ExecArgs } from "@medusajs/framework/types"

import {
  DEFAULT_HOMEPAGE_SECTIONS,
  type HomepageSectionSeed,
} from "../lib/homepage-sections/defaults"
import {
  buildImageLedSectionPatch,
  type HomepageSectionPatch,
  type HomepageSectionRowLike,
} from "../lib/homepage-sections/image-led-sync"
import { clearStorefrontHomepageCache } from "../lib/storefront/homepage"
import { HOMEPAGE_SECTION_MODULE } from "../modules/homepage-section"
import type HomepageSectionModuleService from "../modules/homepage-section/service"

const LEGACY_HERO_PATH = "/images/heroes/home-hero.png"
const CURRENT_HERO_PATH = "/images/hero/home-hero-wear-feel.png"

/** Legacy default copy (pre image-led) — safe-merge only replaces when DB still matches. */
const LEGACY_COPY_BY_KEY: Record<
  string,
  Partial<Pick<HomepageSectionSeed, "title_en" | "body_en" | "title_ar" | "body_ar">>
> = {
  hero: {
    title_en: "Wear What You Feel",
    body_en: "Artist-made passion wear for feelings, identity, and meaningful gifts.",
    body_ar: "قطع فنية قابلة للّبس للمشاعر، الهوية، والهدايا اللي لها معنى.",
  },
  founding_drop: {
    title_en: "Wearable artwork for signs, moods, and personal stories.",
    body_en:
      "Our first collection of artist-made T-shirts, printed in Egypt and made to be worn, gifted, and remembered.",
    body_ar:
      "أول مجموعة من التيشيرتات المصنوعة يدويًا من فنانين، مطبوعة في مصر لتُلبس وتُهدى وتُتذكر.",
  },
  feeling_grid: {
    body_en: "Start with the feeling. Then choose the design.",
    body_ar: "ابدأ بالشعور. ثم اختر التصميم.",
  },
  gift_block: {
    title_en: "More than a gift.",
    body_en:
      "It's a feeling they'll wear. Thoughtful designs for birthdays, anniversaries, graduations, and just because.",
    body_ar: "إحساس هيلبسوه. تصميمات بهدية معنى لأعياد الميلاد، المناسبات، والتقدير من غير سبب.",
  },
  editorial_feature: {
    body_en:
      "A quiet figure, soft movement, and a visual language for people who feel deeply but speak softly. Oversized fit. Heavy cotton feel. Printed in Egypt.",
    body_ar:
      "شخصية هادئة، حركة ناعمة، ولغة بصرية لمن يشعرون بعمق ويتحدثون بهدوء. مقاس واسع. قطن ثقيل. مطبوع في مصر.",
  },
  why_horo: {
    title_en: "Ritual. Rhythm. Connection.",
    title_ar: "طقس. إيقاع. اتصال.",
    body_en:
      "HORO is a wearable-art brand born in Egypt. We turn emotions into art and art into pieces you live in. Every design is a ritual. Every wear is a reminder. We are the canvas. You are the story.",
    body_ar:
      "هورو علامة فنية قابلة للّبس من مصر. بنحوّل المشاعر لفن والفن لقطع تعيش فيها. كل تصميم طقس. كل لبسة تذكير. إحنا القماش. إنت القصة.",
  },
}

type HomepageSectionRow = HomepageSectionRowLike & { id: string }

type HomepageSectionWriteService = HomepageSectionModuleService & {
  listHomepageSections(filters?: Record<string, unknown>): Promise<HomepageSectionRow[]>
  updateHomepageSections(input: HomepageSectionPatch[]): Promise<unknown>
}

export default async function syncHomepageImageLed({ container }: ExecArgs) {
  const service = container.resolve<HomepageSectionWriteService>(HOMEPAGE_SECTION_MODULE)
  const rows = await service.listHomepageSections({})
  const seedsByKey = new Map(DEFAULT_HOMEPAGE_SECTIONS.map((section) => [section.key, section]))

  const toUpdate: HomepageSectionPatch[] = []

  for (const row of rows) {
    const seed = seedsByKey.get(row.key)
    if (!seed) continue

    const patchBody = buildImageLedSectionPatch(
      row,
      seed,
      LEGACY_COPY_BY_KEY[row.key],
      {
        legacyHeroPath: LEGACY_HERO_PATH,
        currentHeroPath: CURRENT_HERO_PATH,
      },
    )

    if (!patchBody) continue

    toUpdate.push({ id: row.id, ...patchBody })
  }

  if (toUpdate.length > 0) {
    await service.updateHomepageSections(toUpdate)
    clearStorefrontHomepageCache()
  }

  console.log(`sync-homepage-image-led: updated ${toUpdate.length} section(s)`)
}
