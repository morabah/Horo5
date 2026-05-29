import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { WHATSAPP_SCRIPT_MODULE } from "../../../../../modules/whatsapp-script"
import type WhatsappScriptModuleService from "../../../../../modules/whatsapp-script/service"
import { assertTaxonomyAdminWrite } from "../../taxonomy-auth"

const PURPOSES = ["opening", "cod_confirmation", "gift_help", "exchange", "ugc_request"] as const
const LOCALES = ["en", "ar"] as const

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

function updateDataFromBody(body: unknown): Record<string, unknown> {
  const b = body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : {}
  const data: Record<string, unknown> = {}

  const name = cleanString(b.name)
  if (name !== undefined) data.name = name
  const bodyTemplate = cleanString(b.body_template ?? b.bodyTemplate)
  if (bodyTemplate !== undefined) data.body_template = bodyTemplate

  if (typeof b.purpose === "string" && (PURPOSES as readonly string[]).includes(b.purpose)) {
    data.purpose = b.purpose
  }
  if (typeof b.locale === "string" && (LOCALES as readonly string[]).includes(b.locale)) {
    data.locale = b.locale
  }

  const version = cleanNumber(b.version)
  if (version !== undefined) data.version = Math.max(1, version)
  const active = cleanBoolean(b.active)
  if (active !== undefined) data.active = active
  const sortOrder = cleanNumber(b.sort_order ?? b.sortOrder)
  if (sortOrder !== undefined) data.sort_order = sortOrder

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

  const service = req.scope.resolve<WhatsappScriptModuleService>(WHATSAPP_SCRIPT_MODULE)
  try {
    const script = await service.updateWhatsappScripts({ id, ...updateData } as never)
    res.status(200).json({ script })
  } catch {
    res.status(404).json({ message: "WhatsApp script not found." })
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

  const service = req.scope.resolve<WhatsappScriptModuleService>(WHATSAPP_SCRIPT_MODULE)
  try {
    await service.deleteWhatsappScripts(id)
    res.status(200).json({ id, deleted: true })
  } catch {
    res.status(404).json({ message: "WhatsApp script not found." })
  }
}
