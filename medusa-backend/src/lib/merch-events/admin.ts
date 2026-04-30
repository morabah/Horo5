import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { MERCH_EVENT_MODULE } from "../../modules/merch-event"
import type MerchEventModuleService from "../../modules/merch-event/service"
import { validateTaxonomySlug } from "../storefront/taxonomy-slug"
import { MERCH_EVENT_STATUSES } from "./types"
import type {
  AdminMerchEvent,
  MerchEventInput,
  MerchEventListFilters,
  MerchEventResult,
  MerchEventStatus,
  MerchEventType,
  MerchEventValidationIssue,
  NormalizedMerchEventInput,
} from "./types"

type Query = {
  graph: (query: Record<string, unknown>) => Promise<{ data?: unknown }>
}

type MerchEventRecord = {
  id: string
  slug?: string | null
  name?: string | null
  type?: string | null
  teaser?: string | null
  body?: string | null
  status?: string | null
  starts_at?: Date | string | null
  ends_at?: Date | string | null
  hero_image_src?: string | null
  hero_image_alt?: string | null
  card_image_src?: string | null
  card_image_alt?: string | null
  seo_title?: string | null
  seo_description?: string | null
  sort_order?: number | null
  active?: boolean | null
  product_handles?: unknown
  occasion_slug?: string | null
  created_at?: Date | string | null
  updated_at?: Date | string | null
}

const STATUS_TRANSITIONS: Record<MerchEventStatus, MerchEventStatus[]> = {
  draft: ["draft", "scheduled", "active", "archived"],
  scheduled: ["scheduled", "active", "draft", "archived"],
  active: ["active", "archived", "draft"],
  archived: ["archived", "draft", "scheduled"],
}

function asOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function asNullableString(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.map((entry: unknown) => String(entry || "").trim()).filter(Boolean))]
}

function serializeDate(value: Date | string | null | undefined): string | null {
  if (!value) return null
  const ms = value instanceof Date ? value.getTime() : Date.parse(String(value))
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null
}

function parseDateInput(value: unknown, field: string, issues: MerchEventValidationIssue[]): string | null {
  if (value === undefined || value === null || value === "") return null
  const ms = Date.parse(String(value))
  if (!Number.isFinite(ms)) {
    issues.push({ field, message: "Use a valid date/time." })
    return null
  }
  return new Date(ms).toISOString()
}

function parseInteger(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value)
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return Math.trunc(parsed)
  }
  return fallback
}

function typeIsValid(value: string) {
  return /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(value)
}

export function buildAdminMerchEvent(record: MerchEventRecord, linkedProductCount?: number): AdminMerchEvent {
  const type = asOptionalString(record.type) || "campaign"

  return {
    id: record.id,
    slug: record.slug || "",
    name: record.name || "",
    type: (typeIsValid(type) ? type : "campaign") as MerchEventType,
    teaser: record.teaser || "",
    body: record.body || "",
    status: (MERCH_EVENT_STATUSES.includes(record.status as MerchEventStatus) ? record.status : "scheduled") as MerchEventStatus,
    startsAt: serializeDate(record.starts_at),
    endsAt: serializeDate(record.ends_at),
    heroImageSrc: record.hero_image_src || null,
    heroImageAlt: record.hero_image_alt || null,
    cardImageSrc: record.card_image_src || null,
    cardImageAlt: record.card_image_alt || null,
    seoTitle: record.seo_title || null,
    seoDescription: record.seo_description || null,
    sortOrder: Number(record.sort_order || 0),
    active: record.active !== false,
    productHandles: asStringArray(record.product_handles),
    occasionSlug: record.occasion_slug || null,
    linkedProductCount,
    createdAt: serializeDate(record.created_at),
    updatedAt: serializeDate(record.updated_at),
  }
}

export function normalizeMerchEventInput(
  input: MerchEventInput,
  options: { mode: "create" | "update"; existing?: AdminMerchEvent } = { mode: "create" },
): MerchEventResult {
  const issues: MerchEventValidationIssue[] = []
  const data: NormalizedMerchEventInput = {}

  if (options.mode === "create" || input.slug !== undefined) {
    const slug = asOptionalString(input.slug)
    if (!slug) {
      issues.push({ field: "slug", message: "Slug is required." })
    } else {
      const slugError = validateTaxonomySlug(slug)
      if (slugError) issues.push({ field: "slug", message: slugError })
      data.slug = slug
    }
  }

  if (options.mode === "create" || input.name !== undefined) {
    const name = asOptionalString(input.name)
    if (!name) {
      issues.push({ field: "name", message: "Name is required." })
    } else {
      data.name = name
    }
  }

  if (input.type !== undefined || options.mode === "create") {
    const type = asOptionalString(input.type) || "campaign"
    if (!typeIsValid(type)) {
      issues.push({ field: "type", message: "Type must be lowercase slug text." })
    } else {
      data.type = type
    }
  }

  if (input.status !== undefined || options.mode === "create") {
    const status = (asOptionalString(input.status) || "scheduled") as MerchEventStatus
    const current = options.existing?.status
    if (!MERCH_EVENT_STATUSES.includes(status)) {
      issues.push({ field: "status", message: `Invalid status "${status}".` })
    } else if (current && !STATUS_TRANSITIONS[current]?.includes(status)) {
      issues.push({ field: "status", message: `Cannot transition from "${current}" to "${status}".` })
    } else {
      data.status = status
    }
  }

  if (input.teaser !== undefined) data.teaser = asOptionalString(input.teaser) || ""
  if (input.body !== undefined) data.body = asOptionalString(input.body) || ""
  if (input.hero_image_src !== undefined) data.hero_image_src = asNullableString(input.hero_image_src)
  if (input.hero_image_alt !== undefined) data.hero_image_alt = asNullableString(input.hero_image_alt)
  if (input.card_image_src !== undefined) data.card_image_src = asNullableString(input.card_image_src)
  if (input.card_image_alt !== undefined) data.card_image_alt = asNullableString(input.card_image_alt)
  if (input.seo_title !== undefined) data.seo_title = asNullableString(input.seo_title)
  if (input.seo_description !== undefined) data.seo_description = asNullableString(input.seo_description)
  if (input.occasion_slug !== undefined) data.occasion_slug = asNullableString(input.occasion_slug)
  if (input.product_handles !== undefined) data.product_handles = asStringArray(input.product_handles)
  if (input.sort_order !== undefined) data.sort_order = parseInteger(input.sort_order, 0)
  if (input.active !== undefined) data.active = input.active !== false
  if (input.starts_at !== undefined) data.starts_at = parseDateInput(input.starts_at, "starts_at", issues)
  if (input.ends_at !== undefined) data.ends_at = parseDateInput(input.ends_at, "ends_at", issues)

  const nextStartsAt = data.starts_at !== undefined ? data.starts_at : options.existing?.startsAt ?? null
  const nextEndsAt = data.ends_at !== undefined ? data.ends_at : options.existing?.endsAt ?? null
  if (nextStartsAt && nextEndsAt && Date.parse(nextStartsAt) >= Date.parse(nextEndsAt)) {
    issues.push({ field: "ends_at", message: "End date must be after start date." })
  }

  const nextStatus = data.status ?? options.existing?.status
  if (nextStatus === "scheduled" && !nextStartsAt) {
    issues.push({ field: "starts_at", message: "Scheduled merch events require a start date." })
  }

  if (issues.length > 0) return { ok: false, issues }
  return { ok: true, data }
}

export function merchEventInputToRecord(input: NormalizedMerchEventInput): Record<string, unknown> {
  const data: Record<string, unknown> = {}

  for (const key of [
    "slug",
    "name",
    "type",
    "teaser",
    "body",
    "status",
    "starts_at",
    "ends_at",
    "hero_image_src",
    "hero_image_alt",
    "card_image_src",
    "card_image_alt",
    "seo_title",
    "seo_description",
    "sort_order",
    "active",
    "product_handles",
    "occasion_slug",
  ] as const) {
    if (input[key] !== undefined) data[key] = input[key]
  }

  return data
}

async function countLinkedProducts(container: MedusaContainer, handles: string[]) {
  const uniqueHandles = [...new Set(handles.map((handle) => handle.trim()).filter(Boolean))]
  if (!uniqueHandles.length) return 0

  const query = container.resolve<Query>(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "product",
    fields: ["id", "handle"],
    filters: { handle: uniqueHandles },
    pagination: { take: uniqueHandles.length },
  })

  return ((data || []) as Array<{ id?: string }>).filter((row) => row.id).length
}

function matchesSearch(event: AdminMerchEvent, q?: string) {
  if (!q?.trim()) return true
  const needle = q.trim().toLowerCase()
  return [event.name, event.slug, event.type, event.status, event.occasionSlug ?? ""].some((value) =>
    value.toLowerCase().includes(needle),
  )
}

export async function listAdminMerchEvents(container: MedusaContainer, filters: MerchEventListFilters = {}) {
  const service = container.resolve<MerchEventModuleService>(MERCH_EVENT_MODULE)
  const serviceFilters: Record<string, unknown> = {}
  if (filters.status) serviceFilters.status = filters.status
  if (filters.type) serviceFilters.type = filters.type
  if (filters.active !== undefined) serviceFilters.active = filters.active

  const rows = (await service.listMerchEvents(serviceFilters)) as MerchEventRecord[]
  const all = rows
    .map((row) => buildAdminMerchEvent(row))
    .filter((event) => matchesSearch(event, filters.q))
    .sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name))

  const offset = Math.max(0, filters.offset ?? 0)
  const limit = Math.max(1, Math.min(500, filters.limit ?? 100))

  return {
    events: all.slice(offset, offset + limit),
    count: all.length,
    limit,
    offset,
  }
}

export async function retrieveAdminMerchEvent(container: MedusaContainer, idOrSlug: string) {
  const service = container.resolve<MerchEventModuleService>(MERCH_EVENT_MODULE)
  const byId = (await service.listMerchEvents({ id: idOrSlug })) as MerchEventRecord[]
  const rows = byId.length ? byId : ((await service.listMerchEvents({ slug: idOrSlug })) as MerchEventRecord[])
  const row = rows[0]
  if (!row) return null

  const base = buildAdminMerchEvent(row)
  const linkedProductCount = await countLinkedProducts(container, base.productHandles)
  return { ...base, linkedProductCount }
}
