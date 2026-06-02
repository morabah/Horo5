/**
 * Safe-merge homepage rows toward image-led copy and presentation defaults.
 * - Updates EN/AR text only when it still matches a known legacy default string.
 * - Merges payload.presentation when missing (never removes existing payload keys).
 * - Sets image_src only when empty (or legacy hero path).
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
  DEFAULT_PRESENTATION_BY_SECTION_KEY,
  mergePresentationIntoPayload,
  type HomepagePresentation,
} from "../lib/homepage-sections/presentation"
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
  },
  founding_drop: {
    title_en: "Wearable artwork for signs, moods, and personal stories.",
    body_en:
      "Our first collection of artist-made T-shirts, printed in Egypt and made to be worn, gifted, and remembered.",
  },
  feeling_grid: {
    body_en: "Start with the feeling. Then choose the design.",
  },
  gift_block: {
    title_en: "More than a gift.",
    body_en:
      "It's a feeling they'll wear. Thoughtful designs for birthdays, anniversaries, graduations, and just because.",
  },
  editorial_feature: {
    body_en:
      "A quiet figure, soft movement, and a visual language for people who feel deeply but speak softly. Oversized fit. Heavy cotton feel. Printed in Egypt.",
  },
  why_horo: {
    title_en: "Ritual. Rhythm. Connection.",
    body_en:
      "HORO is a wearable-art brand born in Egypt. We turn emotions into art and art into pieces you live in. Every design is a ritual. Every wear is a reminder. We are the canvas. You are the story.",
  },
}

type HomepageSectionRow = HomepageSectionSeed & {
  id: string
  image_src?: string | null
  payload?: Record<string, unknown> | null
}

type HomepageSectionWriteService = HomepageSectionModuleService & {
  listHomepageSections(filters?: Record<string, unknown>): Promise<HomepageSectionRow[]>
  updateHomepageSections(input: Array<HomepageSectionRow & { id: string }>): Promise<unknown>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function presentationMissing(payload: Record<string, unknown> | null | undefined): boolean {
  if (!isRecord(payload)) return true
  return !isRecord(payload.presentation)
}

function mergePresentation(
  key: string,
  payload: Record<string, unknown> | null | undefined,
): Record<string, unknown> | undefined {
  const defaults = DEFAULT_PRESENTATION_BY_SECTION_KEY[key]
  if (!defaults || !presentationMissing(payload)) return undefined
  const current = isRecord(payload?.presentation)
    ? (payload!.presentation as HomepagePresentation)
    : {}
  return mergePresentationIntoPayload(payload, { ...defaults, ...current })
}

function textStillLegacy(
  current: string | null | undefined,
  legacy: string | null | undefined,
): boolean {
  if (!legacy) return false
  const normalized = (current ?? "").trim()
  return normalized === legacy.trim() || normalized === ""
}

export default async function syncHomepageImageLed({ container }: ExecArgs) {
  const service = container.resolve<HomepageSectionWriteService>(HOMEPAGE_SECTION_MODULE)
  const rows = await service.listHomepageSections({})
  const seedsByKey = new Map(DEFAULT_HOMEPAGE_SECTIONS.map((section) => [section.key, section]))

  const toUpdate: Array<HomepageSectionRow & { id: string }> = []

  for (const row of rows) {
    const seed = seedsByKey.get(row.key)
    if (!seed) continue

    const legacy = LEGACY_COPY_BY_KEY[row.key]
    const patch: HomepageSectionRow & { id: string } = { ...row, id: row.id }
    let changed = false

    if (legacy) {
      if (textStillLegacy(row.title_en, legacy.title_en) && seed.title_en) {
        patch.title_en = seed.title_en
        changed = true
      }
      if (textStillLegacy(row.title_ar, legacy.title_ar) && seed.title_ar) {
        patch.title_ar = seed.title_ar
        changed = true
      }
      if (legacy.body_en !== undefined) {
        if (textStillLegacy(row.body_en, legacy.body_en)) {
          patch.body_en = seed.body_en ?? null
          changed = true
        }
      }
      if (legacy.body_ar !== undefined) {
        if (textStillLegacy(row.body_ar, legacy.body_ar)) {
          patch.body_ar = seed.body_ar ?? null
          changed = true
        }
      }
    }

    const mergedPresentation = mergePresentation(row.key, row.payload)
    if (mergedPresentation) {
      patch.payload = mergedPresentation
      changed = true
    }

    const seedImage = seed.image_src?.trim()
    const currentImage = row.image_src?.trim()
    if (seedImage && (!currentImage || (row.key === "hero" && currentImage === LEGACY_HERO_PATH))) {
      patch.image_src = row.key === "hero" ? CURRENT_HERO_PATH : seedImage
      if (seed.image_alt_en) patch.image_alt_en = seed.image_alt_en
      if (seed.image_alt_ar) patch.image_alt_ar = seed.image_alt_ar
      changed = true
    }

    if (changed) {
      toUpdate.push(patch)
    }
  }

  if (toUpdate.length > 0) {
    await service.updateHomepageSections(toUpdate)
    clearStorefrontHomepageCache()
  }

  console.log(`sync-homepage-image-led: updated ${toUpdate.length} section(s)`)
}
