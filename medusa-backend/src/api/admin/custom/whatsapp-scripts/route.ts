import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { WHATSAPP_SCRIPT_MODULE } from "../../../../modules/whatsapp-script"
import type WhatsappScriptModuleService from "../../../../modules/whatsapp-script/service"
import { assertTaxonomyAdminWrite } from "../taxonomy-auth"

const PURPOSES = ["opening", "cod_confirmation", "gift_help", "exchange", "ugc_request"] as const
const LOCALES = ["en", "ar"] as const

type Purpose = (typeof PURPOSES)[number]
type Locale = (typeof LOCALES)[number]

function cleanString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined
}

function cleanNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined
  const n = Number(value)
  if (!Number.isFinite(n)) return undefined
  return Math.max(0, Math.floor(n))
}

function cleanBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value
  if (typeof value === "string") {
    const s = value.trim().toLowerCase()
    if (s === "true" || s === "1" || s === "yes") return true
    if (s === "false" || s === "0" || s === "no") return false
  }
  return undefined
}

function isPurpose(value: unknown): value is Purpose {
  return typeof value === "string" && (PURPOSES as readonly string[]).includes(value)
}

function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value)
}

function queryString(value: unknown): string | undefined {
  if (Array.isArray(value)) return queryString(value[0])
  return cleanString(value)
}

function normalizeCreateInput(body: unknown) {
  const issues: string[] = []
  const b = body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : {}
  const data: Record<string, unknown> = {}

  const name = cleanString(b.name)
  const bodyTemplate = cleanString(b.body_template ?? b.bodyTemplate)
  if (!name) issues.push("name is required")
  if (!bodyTemplate) issues.push("body_template is required")
  if (name) data.name = name
  if (bodyTemplate) data.body_template = bodyTemplate

  const purpose = b.purpose
  if (isPurpose(purpose)) data.purpose = purpose
  else if (purpose != null) issues.push("purpose is invalid")
  else data.purpose = "opening"

  const locale = b.locale
  if (isLocale(locale)) data.locale = locale
  else if (locale != null) issues.push("locale is invalid")
  else data.locale = "en"

  const version = cleanNumber(b.version)
  if (version !== undefined) data.version = Math.max(1, version)

  const active = cleanBoolean(b.active)
  if (active !== undefined) data.active = active

  const sortOrder = cleanNumber(b.sort_order ?? b.sortOrder)
  if (sortOrder !== undefined) data.sort_order = sortOrder

  return { ok: issues.length === 0, data, issues }
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve<WhatsappScriptModuleService>(WHATSAPP_SCRIPT_MODULE)
  const skip = Math.max(0, parseInt(String(req.query.skip ?? "0"), 10) || 0)
  const take = Math.min(200, Math.max(1, parseInt(String(req.query.take ?? "50"), 10) || 50))
  const filters: Record<string, unknown> = {}

  const purpose = queryString(req.query.purpose)
  if (purpose && (PURPOSES as readonly string[]).includes(purpose)) filters.purpose = purpose
  const locale = queryString(req.query.locale)
  if (locale && (LOCALES as readonly string[]).includes(locale)) filters.locale = locale
  const active = cleanBoolean(req.query.active)
  if (active !== undefined) filters.active = active

  const [rows, count] = await service.listAndCountWhatsappScripts(filters, {
    skip,
    take,
    order: { active: "DESC", purpose: "ASC", sort_order: "ASC", version: "DESC" },
  } as never)

  res.status(200).json({
    scripts: rows,
    total: count,
    skip,
    take,
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (!assertTaxonomyAdminWrite(req, res)) {
    return
  }

  const normalized = normalizeCreateInput(req.body)
  if (!normalized.ok) {
    res.status(400).json({ message: "Invalid WhatsApp script input.", issues: normalized.issues })
    return
  }

  const service = req.scope.resolve<WhatsappScriptModuleService>(WHATSAPP_SCRIPT_MODULE)
  const created = await service.createWhatsappScripts(normalized.data as never)
  res.status(201).json({ script: created })
}

