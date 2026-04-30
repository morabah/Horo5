import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { getAdminDrop } from "../../../../../lib/drops/admin"
import { revalidateStorefrontForDrop } from "../../../../../lib/drops/revalidate-storefront"
import { upsertDrop } from "../../../../../lib/drops/upsert-drop"
import type { UpsertDropPayload } from "../../../../../lib/drops/types"
import { DropValidationError } from "../../../../../lib/drops/validate"
import { assertTaxonomyAdminWrite } from "../../taxonomy-auth"

function sendDropError(res: MedusaResponse, error: unknown) {
  if (error instanceof DropValidationError) {
    res.status(400).json({ message: error.message, issues: error.issues })
    return
  }

  res.status(500).json({ message: error instanceof Error ? error.message : String(error) })
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const handle = req.params?.handle as string | undefined
  if (!handle) {
    res.status(400).json({ message: "Missing handle" })
    return
  }

  const drop = await getAdminDrop(req.scope, handle)
  if (!drop) {
    res.status(404).json({ message: "Drop not found" })
    return
  }

  res.status(200).json({ drop })
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  if (!assertTaxonomyAdminWrite(req, res)) {
    return
  }

  const handle = req.params?.handle as string | undefined
  if (!handle) {
    res.status(400).json({ message: "Missing handle" })
    return
  }

  try {
    const body = req.body as UpsertDropPayload
    const result = await upsertDrop(req.scope, { ...body, handle: body.handle || handle }, { existingHandle: handle })
    revalidateStorefrontForDrop(body.handle || handle)
    res.status(200).json({ drop: result })
  } catch (error) {
    sendDropError(res, error)
  }
}
