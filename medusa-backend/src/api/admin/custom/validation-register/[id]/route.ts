import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { VALIDATION_REGISTER_MODULE } from "../../../../../modules/validation-register"
import type ValidationRegisterModuleService from "../../../../../modules/validation-register/service"
import { assertTaxonomyAdminWrite } from "../../taxonomy-auth"

const STATUSES = ["draft", "testing", "passed", "failed", "decided", "archived"] as const
const DECISIONS = ["untested", "ship", "revise", "hold", "retire", "override"] as const

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

function updateDataFromBody(body: unknown): Record<string, unknown> {
  const b = body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : {}
  const data: Record<string, unknown> = {}

  if (typeof b.status === "string" && (STATUSES as readonly string[]).includes(b.status)) {
    data.status = b.status
  }
  if (typeof b.decision === "string" && (DECISIONS as readonly string[]).includes(b.decision)) {
    data.decision = b.decision
  }

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

  return data
}

export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  if (!assertTaxonomyAdminWrite(req, res)) {
    return
  }

  const id = req.params?.id as string | undefined
  if (!id) {
    res.status(400).json({ message: "Missing id." })
    return
  }

  const updateData = updateDataFromBody(req.body)
  if (Object.keys(updateData).length === 0) {
    res.status(400).json({ message: "No valid fields to update." })
    return
  }

  const service = req.scope.resolve<ValidationRegisterModuleService>(VALIDATION_REGISTER_MODULE)
  try {
    const entry = await service.updateValidationRegisterEntries({ id, ...updateData } as never)
    res.status(200).json({ entry })
  } catch {
    res.status(404).json({ message: "Validation-register entry not found." })
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  if (!assertTaxonomyAdminWrite(req, res)) {
    return
  }

  const id = req.params?.id as string | undefined
  if (!id) {
    res.status(400).json({ message: "Missing id." })
    return
  }

  const service = req.scope.resolve<ValidationRegisterModuleService>(VALIDATION_REGISTER_MODULE)
  try {
    await service.deleteValidationRegisterEntries(id)
    res.status(200).json({ id, deleted: true })
  } catch {
    res.status(404).json({ message: "Validation-register entry not found." })
  }
}
