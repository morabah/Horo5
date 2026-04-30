import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { revalidateStorefrontForDrop } from "../../../../../lib/drops/revalidate-storefront"
import {
  merchEventInputToRecord,
  normalizeMerchEventInput,
  retrieveAdminMerchEvent,
} from "../../../../../lib/merch-events/admin"
import type { MerchEventInput } from "../../../../../lib/merch-events/types"
import { MERCH_EVENT_MODULE } from "../../../../../modules/merch-event"
import type MerchEventModuleService from "../../../../../modules/merch-event/service"
import { applySlugImmutabilityToPatchData } from "../../slug-patch-guard"
import { assertTaxonomyAdminWrite } from "../../taxonomy-auth"

function param(req: MedusaRequest) {
  return req.params?.id as string | undefined
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const id = param(req)
  if (!id) {
    res.status(400).json({ message: "Missing id." })
    return
  }

  const event = await retrieveAdminMerchEvent(req.scope, id)
  if (!event) {
    res.status(404).json({ message: "Merch event not found." })
    return
  }

  res.status(200).json({ event })
}

export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  if (!assertTaxonomyAdminWrite(req, res)) {
    return
  }

  const id = param(req)
  if (!id) {
    res.status(400).json({ message: "Missing id." })
    return
  }

  const existing = await retrieveAdminMerchEvent(req.scope, id)
  if (!existing) {
    res.status(404).json({ message: "Merch event not found." })
    return
  }

  const body = { ...((req.body || {}) as MerchEventInput) } as MerchEventInput & Record<string, unknown>
  if (!applySlugImmutabilityToPatchData(res, body, existing.slug)) {
    return
  }

  const normalized = normalizeMerchEventInput(body, { mode: "update", existing })
  if (!normalized.ok) {
    res.status(400).json({ message: "Invalid merch event.", issues: normalized.issues })
    return
  }

  const service = req.scope.resolve<MerchEventModuleService>(MERCH_EVENT_MODULE)
  await service.updateMerchEvents({
    selector: { id: existing.id },
    data: merchEventInputToRecord(normalized.data),
  })

  const event = await retrieveAdminMerchEvent(req.scope, existing.id)
  revalidateStorefrontForDrop("*")
  res.status(200).json({ event })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  if (!assertTaxonomyAdminWrite(req, res)) {
    return
  }

  const id = param(req)
  if (!id) {
    res.status(400).json({ message: "Missing id." })
    return
  }

  const existing = await retrieveAdminMerchEvent(req.scope, id)
  if (!existing) {
    res.status(404).json({ message: "Merch event not found." })
    return
  }

  const service = req.scope.resolve<MerchEventModuleService>(MERCH_EVENT_MODULE)
  await service.updateMerchEvents({
    selector: { id: existing.id },
    data: { active: false, status: "archived" },
  })

  revalidateStorefrontForDrop("*")
  res.status(204).send()
}
