import type { HomepageSectionSeed } from "./defaults"
import {
  DEFAULT_PRESENTATION_BY_SECTION_KEY,
  mergePresentationIntoPayload,
  parseHomepagePresentation,
} from "./presentation"

export type HomepageSectionRowLike = {
  key: string
  title_en?: string | null
  title_ar?: string | null
  body_en?: string | null
  body_ar?: string | null
  image_src?: string | null
  image_alt_en?: string | null
  image_alt_ar?: string | null
  payload?: Record<string, unknown> | null
}

export type HomepageSectionPatch = {
  id: string
  title_en?: string | null
  title_ar?: string | null
  body_en?: string | null
  body_ar?: string | null
  image_src?: string | null
  image_alt_en?: string | null
  image_alt_ar?: string | null
  payload?: Record<string, unknown> | null
}

export function textStillLegacy(
  current: string | null | undefined,
  legacy: string | null | undefined,
): boolean {
  if (!legacy) return false
  const normalized = (current ?? "").trim()
  return normalized === legacy.trim() || normalized === ""
}

export function mergePresentationPayload(
  key: string,
  payload: Record<string, unknown> | null | undefined,
): Record<string, unknown> | undefined {
  const defaults = DEFAULT_PRESENTATION_BY_SECTION_KEY[key]
  if (!defaults) return undefined

  const existing = parseHomepagePresentation(payload)
  const merged = mergePresentationIntoPayload(payload, { ...defaults, ...existing })
  const before = JSON.stringify(
    isRecord(payload) ? payload.presentation ?? null : null,
  )
  const after = JSON.stringify(merged.presentation ?? null)
  if (before === after) return undefined
  return merged
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

export function buildImageLedSectionPatch(
  row: HomepageSectionRowLike,
  seed: HomepageSectionSeed,
  legacy: Partial<Pick<HomepageSectionSeed, "title_en" | "body_en" | "title_ar" | "body_ar">> | undefined,
  options?: {
    legacyHeroPath?: string
    currentHeroPath?: string
  },
): HomepageSectionPatch | null {
  const patch: Omit<HomepageSectionPatch, "id"> = {}
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
    if (legacy.body_en !== undefined && textStillLegacy(row.body_en, legacy.body_en)) {
      patch.body_en = seed.body_en ?? null
      changed = true
    }
    if (legacy.body_ar !== undefined && textStillLegacy(row.body_ar, legacy.body_ar)) {
      patch.body_ar = seed.body_ar ?? null
      changed = true
    }
  }

  const mergedPresentation = mergePresentationPayload(row.key, row.payload)
  if (mergedPresentation) {
    patch.payload = mergedPresentation
    changed = true
  }

  const seedImage = seed.image_src?.trim()
  const currentImage = row.image_src?.trim()
  const legacyHero = options?.legacyHeroPath
  const currentHero = options?.currentHeroPath

  if (
    seedImage &&
    (!currentImage || (row.key === "hero" && legacyHero && currentImage === legacyHero))
  ) {
    patch.image_src = row.key === "hero" && currentHero ? currentHero : seedImage
    if (seed.image_alt_en) patch.image_alt_en = seed.image_alt_en
    if (seed.image_alt_ar) patch.image_alt_ar = seed.image_alt_ar
    changed = true
  }

  return changed ? patch : null
}
