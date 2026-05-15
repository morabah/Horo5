import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { VALIDATION_REGISTER_MODULE } from "../../../../modules/validation-register"
import type ValidationRegisterModuleService from "../../../../modules/validation-register/service"
import { assertTaxonomyAdminWrite } from "../taxonomy-auth"

const RECORD_TYPES = ["buyer_validation", "empathy_interview", "evidence_register", "creative_test"] as const
const STATUSES = ["draft", "testing", "passed", "failed", "decided", "archived"] as const
const DECISIONS = ["untested", "ship", "revise", "hold", "retire", "override"] as const

type RecordType = (typeof RECORD_TYPES)[number]
type Status = (typeof STATUSES)[number]
type Decision = (typeof DECISIONS)[number]

function isOneOf<T extends readonly string[]>(value: unknown, allowed: T): value is T[number] {
  return typeof value === "string" && (allowed as readonly string[]).includes(value.trim())
}

function cleanString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined
}

function cleanNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined
  const n = Number(value)
  if (!Number.isFinite(n)) return undefined
  return Math.max(0, Math.floor(n))
}

function cleanJson(value: unknown): unknown | undefined {
  if (value == null) return undefined
  if (typeof value === "object") return value
  return undefined
}

function normalizeInput(body: unknown, mode: "create" | "update") {
  const issues: string[] = []
  const b = body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : {}
  const data: Record<string, unknown> = {}

  const recordType = b.record_type ?? b.recordType
  if (isOneOf(recordType, RECORD_TYPES)) data.record_type = recordType as RecordType
  else if (mode === "create") data.record_type = "buyer_validation"

  const status = b.status
  if (isOneOf(status, STATUSES)) data.status = status as Status
  else if (mode === "create") data.status = "draft"
  else if (status != null) issues.push("status is invalid")

  const decision = b.decision
  if (isOneOf(decision, DECISIONS)) data.decision = decision as Decision
  else if (mode === "create") data.decision = "untested"
  else if (decision != null) issues.push("decision is invalid")

  for (const key of [
    "title",
    "asset",
    "claim",
    "concern",
    "segment",
    "verbatim",
    "objection",
    "gift_situation",
    "hook",
    "validation_source",
    "owner",
    "week",
    "notes",
  ]) {
    const value = cleanString(b[key])
    if (value !== undefined) data[key] = value
  }

  const buyersTested = cleanNumber(b.buyers_tested ?? b.buyersTested)
  if (buyersTested !== undefined) data.buyers_tested = buyersTested
  const passCount = cleanNumber(b.pass_count ?? b.passCount)
  if (passCount !== undefined) data.pass_count = passCount

  const metrics = cleanJson(b.metrics)
  if (metrics !== undefined) data.metrics = metrics
  const tags = cleanJson(b.tags)
  if (tags !== undefined) data.tags = tags

  if (mode === "create" && !data.title) {
    data.title =
      cleanString(b.claim) ||
      cleanString(b.asset) ||
      cleanString(b.hook) ||
      cleanString(b.verbatim) ||
      cleanString(b.notes)
  }

  if (mode === "create" && !data.title) {
    issues.push("title is required")
  }

  return { ok: issues.length === 0, data, issues }
}

function queryString(value: unknown): string | undefined {
  if (Array.isArray(value)) return queryString(value[0])
  return cleanString(value)
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve<ValidationRegisterModuleService>(VALIDATION_REGISTER_MODULE)
  const skip = Math.max(0, parseInt(String(req.query.skip ?? "0"), 10) || 0)
  const take = Math.min(200, Math.max(1, parseInt(String(req.query.take ?? "50"), 10) || 50))
  const filters: Record<string, unknown> = {}

  const recordType = queryString(req.query.record_type ?? req.query.recordType)
  if (recordType && (RECORD_TYPES as readonly string[]).includes(recordType)) filters.record_type = recordType
  const status = queryString(req.query.status)
  if (status && (STATUSES as readonly string[]).includes(status)) filters.status = status
  const decision = queryString(req.query.decision)
  if (decision && (DECISIONS as readonly string[]).includes(decision)) filters.decision = decision
  for (const key of ["asset", "owner", "week"]) {
    const value = queryString(req.query[key])
    if (value) filters[key] = value
  }

  const [rows, count] = await service.listAndCountValidationRegisterEntries(filters, {
    skip,
    take,
    order: { created_at: "DESC" },
  } as never)

  res.status(200).json({
    entries: rows,
    total: count,
    skip,
    take,
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (!assertTaxonomyAdminWrite(req, res)) {
    return
  }

  const normalized = normalizeInput(req.body, "create")
  if (!normalized.ok) {
    res.status(400).json({ message: "Invalid validation-register input.", issues: normalized.issues })
    return
  }

  const service = req.scope.resolve<ValidationRegisterModuleService>(VALIDATION_REGISTER_MODULE)
  const created = await service.createValidationRegisterEntries(normalized.data as never)
  res.status(201).json({ entry: created })
}
