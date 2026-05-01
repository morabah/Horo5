import type { MedusaContainer } from "@medusajs/framework/types"

import { HOMEPAGE_SECTION_MODULE } from "../../modules/homepage-section"
import { asString } from "../shared/type-guards"
import type HomepageSectionModuleService from "../../modules/homepage-section/service"
import type {
  AdminHomepageSection,
  HomepageSectionInput,
  HomepageSectionListFilters,
  HomepageSectionReorderItem,
  HomepageSectionType,
  HomepageSectionValidationIssue,
} from "./types"
import { HOMEPAGE_SECTION_TYPES } from "./types"

type HomepageSectionRecord = {
  id: string
  key?: string | null
  type?: string | null
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
  created_at?: Date | string | null
  updated_at?: Date | string | null
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function payloadObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function serializeDate(value: Date | string | null | undefined): string | null {
  if (!value) return null
  const ms = value instanceof Date ? value.getTime() : Date.parse(String(value))
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null
}

function hasAnyLocalized(...values: Array<unknown>) {
  return values.some((value) => typeof value === "string" && value.trim())
}

function hasArrayPayload(payload: Record<string, unknown> | null, keys: string[]) {
  if (!payload) return false
  return keys.some((key) => Array.isArray(payload[key]) && (payload[key] as unknown[]).length > 0)
}

export function buildAdminHomepageSection(record: HomepageSectionRecord): AdminHomepageSection {
  return {
    id: record.id,
    key: record.key || "",
    type: (HOMEPAGE_SECTION_TYPES.includes(record.type as HomepageSectionType) ? record.type : "hero") as HomepageSectionType,
    eyebrowEn: record.eyebrow_en || null,
    eyebrowAr: record.eyebrow_ar || null,
    titleEn: record.title_en || null,
    titleAr: record.title_ar || null,
    bodyEn: record.body_en || null,
    bodyAr: record.body_ar || null,
    primaryCtaLabelEn: record.primary_cta_label_en || null,
    primaryCtaLabelAr: record.primary_cta_label_ar || null,
    primaryCtaHref: record.primary_cta_href || null,
    secondaryCtaLabelEn: record.secondary_cta_label_en || null,
    secondaryCtaLabelAr: record.secondary_cta_label_ar || null,
    secondaryCtaHref: record.secondary_cta_href || null,
    imageSrc: record.image_src || null,
    imageAltEn: record.image_alt_en || null,
    imageAltAr: record.image_alt_ar || null,
    accent: record.accent || null,
    sortOrder: Number(record.sort_order || 0),
    active: record.active !== false,
    payload: payloadObject(record.payload),
    createdAt: serializeDate(record.created_at),
    updatedAt: serializeDate(record.updated_at),
  }
}

export function adminHomepageSectionToInput(section: AdminHomepageSection): HomepageSectionInput {
  return {
    key: section.key,
    type: section.type,
    eyebrow_en: section.eyebrowEn,
    eyebrow_ar: section.eyebrowAr,
    title_en: section.titleEn,
    title_ar: section.titleAr,
    body_en: section.bodyEn,
    body_ar: section.bodyAr,
    primary_cta_label_en: section.primaryCtaLabelEn,
    primary_cta_label_ar: section.primaryCtaLabelAr,
    primary_cta_href: section.primaryCtaHref,
    secondary_cta_label_en: section.secondaryCtaLabelEn,
    secondary_cta_label_ar: section.secondaryCtaLabelAr,
    secondary_cta_href: section.secondaryCtaHref,
    image_src: section.imageSrc,
    image_alt_en: section.imageAltEn,
    image_alt_ar: section.imageAltAr,
    accent: section.accent,
    sort_order: section.sortOrder,
    active: section.active,
    payload: section.payload,
  }
}

export function normalizeHomepageSectionInput(input: HomepageSectionInput, mode: "create" | "update" = "create") {
  const issues: HomepageSectionValidationIssue[] = []
  const key = asString(input.key)
  const type = (asString(input.type) || "hero") as HomepageSectionType
  const payload = input.payload === undefined ? undefined : payloadObject(input.payload)

  if (mode === "create" || input.key !== undefined) {
    if (!key) {
      issues.push({ field: "key", message: "Key is required." })
    } else {
      if (!/^[a-zA-Z0-9_-]{2,60}$/.test(key)) {
        issues.push({ field: "key", message: "Key must be 2-60 characters and contain only letters, numbers, hyphens, or underscores." })
      }
    }
  }

  if (input.type !== undefined || mode === "create") {
    if (!HOMEPAGE_SECTION_TYPES.includes(type)) {
      issues.push({ field: "type", message: `Invalid type "${type}".` })
    }
  }

  if (input.payload !== undefined && input.payload !== null && !payload) {
    issues.push({ field: "payload", message: "Payload must be a JSON object." })
  }

  if (type === "hero") {
    if (!hasAnyLocalized(input.title_en, input.title_ar)) {
      issues.push({ field: "title_en", message: "Hero sections need a title." })
    }
    if (!asString(input.primary_cta_href) || !hasAnyLocalized(input.primary_cta_label_en, input.primary_cta_label_ar)) {
      issues.push({ field: "primary_cta_href", message: "Hero sections need a primary CTA label and href." })
    }
  }

  if (type === "trust_ribbon") {
    const hasBody = hasAnyLocalized(input.body_en, input.body_ar)
    const hasItems = hasArrayPayload(payload ?? null, ["items"])
    if (!hasBody && !hasItems) {
      issues.push({ field: "body_en", message: "Trust ribbon sections need body copy or payload.items." })
    }
  }

  if (type === "feeling_grid") {
    const hasTitle = hasAnyLocalized(input.title_en, input.title_ar)
    const hasFeelings = hasArrayPayload(payload ?? null, ["feelings", "feelingSlugs", "items"])
    if (!hasTitle && !hasFeelings) {
      issues.push({ field: "payload", message: "Feeling grid sections need a title or payload feeling slugs." })
    }
  }

  if (issues.length > 0) return { ok: false as const, issues }

  const data: HomepageSectionInput = {
    ...(input.key !== undefined ? { key } : {}),
    ...(input.type !== undefined || mode === "create" ? { type } : {}),
  }

  for (const field of [
    "eyebrow_en",
    "eyebrow_ar",
    "title_en",
    "title_ar",
    "body_en",
    "body_ar",
    "primary_cta_label_en",
    "primary_cta_label_ar",
    "primary_cta_href",
    "secondary_cta_label_en",
    "secondary_cta_label_ar",
    "secondary_cta_href",
    "image_src",
    "image_alt_en",
    "image_alt_ar",
    "accent",
  ] as const) {
    if (input[field] !== undefined) data[field] = nullableString(input[field])
  }

  if (input.sort_order !== undefined) {
    data.sort_order = Number.isFinite(Number(input.sort_order)) ? Math.trunc(Number(input.sort_order)) : 0
  }
  if (input.active !== undefined) data.active = input.active !== false
  if (input.payload !== undefined) data.payload = payload

  return { ok: true as const, data }
}

export function validateHomepageSectionInput(input: HomepageSectionInput): HomepageSectionValidationIssue[] {
  const result = normalizeHomepageSectionInput(input)
  return result.ok ? [] : result.issues
}

export function homepageSectionInputToRecord(input: HomepageSectionInput): Record<string, unknown> {
  const data: Record<string, unknown> = {}

  for (const key of [
    "key",
    "type",
    "eyebrow_en",
    "eyebrow_ar",
    "title_en",
    "title_ar",
    "body_en",
    "body_ar",
    "primary_cta_label_en",
    "primary_cta_label_ar",
    "primary_cta_href",
    "secondary_cta_label_en",
    "secondary_cta_label_ar",
    "secondary_cta_href",
    "image_src",
    "image_alt_en",
    "image_alt_ar",
    "accent",
    "sort_order",
    "active",
    "payload",
  ] as const) {
    if (input[key] !== undefined) data[key] = input[key]
  }

  return data
}

export async function listAdminHomepageSections(container: MedusaContainer, filters: HomepageSectionListFilters = {}) {
  const service = container.resolve<HomepageSectionModuleService>(HOMEPAGE_SECTION_MODULE)
  const serviceFilters: Record<string, unknown> = {}
  if (filters.type) serviceFilters.type = filters.type
  if (filters.active !== undefined) serviceFilters.active = filters.active

  const rows = (await service.listHomepageSections(serviceFilters)) as HomepageSectionRecord[]
  const sections = rows
    .map(buildAdminHomepageSection)
    .sort((left, right) => left.sortOrder - right.sortOrder || left.key.localeCompare(right.key))

  return { sections }
}

export async function retrieveAdminHomepageSection(container: MedusaContainer, idOrKey: string) {
  const service = container.resolve<HomepageSectionModuleService>(HOMEPAGE_SECTION_MODULE)
  const byId = (await service.listHomepageSections({ id: idOrKey })) as HomepageSectionRecord[]
  const rows = byId.length ? byId : ((await service.listHomepageSections({ key: idOrKey })) as HomepageSectionRecord[])
  const row = rows[0]
  return row ? buildAdminHomepageSection(row) : null
}

export async function reorderHomepageSections(container: MedusaContainer, items: HomepageSectionReorderItem[]) {
  const service = container.resolve<HomepageSectionModuleService>(HOMEPAGE_SECTION_MODULE)
  let updated = 0

  for (const item of items) {
    if (!item.id || !Number.isFinite(Number(item.sort_order))) continue
    await service.updateHomepageSections({
      selector: { id: item.id },
      data: { sort_order: Math.trunc(Number(item.sort_order)) },
    })
    updated += 1
  }

  return { updated }
}
