import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { listAdminDrops } from "../../../../lib/drops/admin"
import { upsertDrop } from "../../../../lib/drops/upsert-drop"
import type { UpsertDropPayload } from "../../../../lib/drops/types"
import { DropValidationError } from "../../../../lib/drops/validate"
import { assertTaxonomyAdminWrite } from "../taxonomy-auth"

function sendDropError(res: MedusaResponse, error: unknown) {
  if (error instanceof DropValidationError) {
    res.status(400).json({ message: error.message, issues: error.issues })
    return
  }

  res.status(500).json({ message: error instanceof Error ? error.message : String(error) })
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const q = typeof req.query.q === "string" ? req.query.q : undefined
  const status = typeof req.query.status === "string" ? req.query.status : undefined
  const feeling = typeof req.query.feeling === "string" ? req.query.feeling : undefined
  const occasion = typeof req.query.occasion === "string" ? req.query.occasion : undefined
  const limit = Number(req.query.limit ?? 100)
  const offset = Number(req.query.offset ?? 0)

  const result = await listAdminDrops(req.scope, {
    q,
    status,
    feeling,
    occasion,
    limit: Number.isFinite(limit) ? limit : 100,
    offset: Number.isFinite(offset) ? offset : 0,
  })

  res.status(200).json(result)
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (!assertTaxonomyAdminWrite(req, res)) {
    return
  }

  try {
    const result = await upsertDrop(req.scope, req.body as UpsertDropPayload)
    res.status(201).json({ drop: result })
  } catch (error) {
    sendDropError(res, error)
  }
}
