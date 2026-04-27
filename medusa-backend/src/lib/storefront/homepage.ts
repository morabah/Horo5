import type { MedusaContainer } from "@medusajs/types"

import { HOMEPAGE_SECTION_MODULE } from "../../modules/homepage-section"
import type HomepageSectionModuleService from "../../modules/homepage-section/service"

export type StorefrontHomepageSectionType =
  | "hero"
  | "trust_ribbon"
  | "primary_routes"
  | "founding_drop"
  | "featured_piece"
  | "feeling_grid"
  | "occasion_grid"
  | "gift_block"
  | "why_horo"
  | "first_drop_circle"
  | "proof_strip"
  | "seen_on_you"
  | "artist_spotlight"

export type StorefrontHomepageSectionDTO = {
  id: string
  key: string
  type: StorefrontHomepageSectionType
  eyebrow: { en?: string; ar?: string } | null
  title: { en?: string; ar?: string } | null
  body: { en?: string; ar?: string } | null
  primaryCta: { label: { en?: string; ar?: string } | null; href: string | null } | null
  secondaryCta: { label: { en?: string; ar?: string } | null; href: string | null } | null
  image: { src: string; alt: { en?: string; ar?: string } | null } | null
  accent: string | null
  sortOrder: number
  active: boolean
  payload: Record<string, unknown> | null
}

type HomepageSectionRecord = {
  id: string
  key: string
  type?: StorefrontHomepageSectionType | null
  eyebrow_en?: string | null
  eyebrow_ar?: string | null
  title_en?: string | null
  title_ar?: string | null
  body_en?: string | null
  body_ar?: string | null
  primary_cta_label_en?: string | null
  primary_cta_label_ar?: string | null
  primary_cta_href?: string | null
  secondary_cta_label_en?: string | null
  secondary_cta_label_ar?: string | null
  secondary_cta_href?: string | null
  image_src?: string | null
  image_alt_en?: string | null
  image_alt_ar?: string | null
  accent?: string | null
  sort_order?: number | null
  active?: boolean | null
  payload?: unknown
}

function localized(en?: string | null, ar?: string | null): { en?: string; ar?: string } | null {
  const out = {
    ...(en?.trim() ? { en: en.trim() } : {}),
    ...(ar?.trim() ? { ar: ar.trim() } : {}),
  }
  return Object.keys(out).length > 0 ? out : null
}

function payloadObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

export function buildHomepageSection(section: HomepageSectionRecord): StorefrontHomepageSectionDTO {
  const primaryLabel = localized(section.primary_cta_label_en, section.primary_cta_label_ar)
  const secondaryLabel = localized(section.secondary_cta_label_en, section.secondary_cta_label_ar)
  const imageAlt = localized(section.image_alt_en, section.image_alt_ar)

  return {
    id: section.id,
    key: section.key,
    type: section.type || "hero",
    eyebrow: localized(section.eyebrow_en, section.eyebrow_ar),
    title: localized(section.title_en, section.title_ar),
    body: localized(section.body_en, section.body_ar),
    primaryCta:
      primaryLabel || section.primary_cta_href
        ? { label: primaryLabel, href: section.primary_cta_href || null }
        : null,
    secondaryCta:
      secondaryLabel || section.secondary_cta_href
        ? { label: secondaryLabel, href: section.secondary_cta_href || null }
        : null,
    image: section.image_src?.trim()
      ? { src: section.image_src.trim(), alt: imageAlt }
      : null,
    accent: section.accent || null,
    sortOrder: Number(section.sort_order || 0),
    active: section.active !== false,
    payload: payloadObject(section.payload),
  }
}

export async function listStorefrontHomepageSections(scope: MedusaContainer): Promise<StorefrontHomepageSectionDTO[]> {
  const service = scope.resolve<HomepageSectionModuleService>(HOMEPAGE_SECTION_MODULE)
  const rows = (await service.listHomepageSections({ active: true })) as HomepageSectionRecord[]

  return rows
    .map(buildHomepageSection)
    .filter((section) => section.active)
    .sort((left, right) => left.sortOrder - right.sortOrder)
}

let homepageServerCache: { expiresAt: number; value: { sections: StorefrontHomepageSectionDTO[] } } | null = null
let homepageServerInflight: Promise<{ sections: StorefrontHomepageSectionDTO[] }> | null = null

function homepageCacheMs() {
  const raw = process.env.STOREFRONT_HOMEPAGE_SERVER_CACHE_MS
  if (raw === "0") return 0
  const parsed = Number(raw)
  if (Number.isFinite(parsed) && parsed >= 0) return parsed
  return process.env.NODE_ENV === "production" ? 0 : 300_000
}

export async function getStorefrontHomepageWithServerCache(scope: MedusaContainer) {
  const ttlMs = homepageCacheMs()
  if (ttlMs <= 0) {
    return { sections: await listStorefrontHomepageSections(scope) }
  }

  const now = Date.now()
  if (homepageServerCache && homepageServerCache.expiresAt > now) {
    return homepageServerCache.value
  }
  if (homepageServerInflight) {
    return homepageServerInflight
  }

  homepageServerInflight = listStorefrontHomepageSections(scope)
    .then((sections) => {
      const value = { sections }
      homepageServerCache = { expiresAt: Date.now() + ttlMs, value }
      return value
    })
    .finally(() => {
      homepageServerInflight = null
    })

  return homepageServerInflight
}
