import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { revalidateStorefrontForDrop } from "../../../../lib/drops/revalidate-storefront"
import {
  listAdminMerchEvents,
  merchEventInputToRecord,
  normalizeMerchEventInput,
  retrieveAdminMerchEvent,
} from "../../../../lib/merch-events/admin"
import type { MerchEventInput, MerchEventStatus } from "../../../../lib/merch-events/types"
import { MERCH_EVENT_MODULE } from "../../../../modules/merch-event"
import type MerchEventModuleService from "../../../../modules/merch-event/service"
import { assertTaxonomyAdminWrite } from "../taxonomy-auth"

function parseBoolean(value: unknown): boolean | undefined {
  if (Array.isArray(value)) return parseBoolean(value[0])
  if (typeof value !== "string") return undefined
  const normalized = value.trim().toLowerCase()
  if (["1", "true", "yes", "active"].includes(normalized)) return true
  if (["0", "false", "no", "inactive"].includes(normalized)) return false
  return undefined
}

function parseNumber(value: unknown, fallback: number) {
  const raw = Array.isArray(value) ? value[0] : value
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const result = await listAdminMerchEvents(req.scope, {
    q: typeof req.query.q === "string" ? req.query.q : undefined,
    status: typeof req.query.status === "string" ? req.query.status as MerchEventStatus : undefined,
    type: typeof req.query.type === "string" ? req.query.type : undefined,
    active: parseBoolean(req.query.active),
    limit: parseNumber(req.query.limit, 100),
    offset: parseNumber(req.query.offset, 0),
  })

  res.status(200).json(result)
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (!assertTaxonomyAdminWrite(req, res)) {
    return
  }

  const body = (req.body || {}) as MerchEventInput
  const normalized = normalizeMerchEventInput(body, { mode: "create" })
  if (!normalized.ok) {
    res.status(400).json({ message: "Invalid merch event.", issues: normalized.issues })
    return
  }

  const service = req.scope.resolve<MerchEventModuleService>(MERCH_EVENT_MODULE)
  const slug = normalized.data.slug
  const duplicate = slug ? await service.listMerchEvents({ slug }) : []
  if ((duplicate as Array<{ id?: string }>).length > 0) {
    res.status(409).json({ message: `A merch event with slug "${slug}" already exists.` })
    return
  }

  await service.createMerchEvents(merchEventInputToRecord(normalized.data))

  const event = slug ? await retrieveAdminMerchEvent(req.scope, slug) : null
  revalidateStorefrontForDrop("*")
  res.status(201).json({ event })
}
