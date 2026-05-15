import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { OBJECTION_LOG_MODULE } from "../../../../../modules/objection-log"
import type ObjectionLogModuleService from "../../../../../modules/objection-log/service"
import { assertTaxonomyAdminWrite } from "../../taxonomy-auth"

export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  if (!assertTaxonomyAdminWrite(req, res)) {
    return
  }

  const id = req.params?.id as string | undefined
  if (!id) {
    res.status(400).json({ message: "Missing id." })
    return
  }

  const body = (req.body || {}) as Record<string, unknown>
  const service = req.scope.resolve<ObjectionLogModuleService>(OBJECTION_LOG_MODULE)

  const updateData: Record<string, unknown> = {}

  if (typeof body.resolved === "boolean") {
    updateData.resolved = body.resolved
    if (body.resolved) {
      updateData.resolution_date = new Date()
    }
  }

  if (typeof body.resolution === "string" && body.resolution.trim()) {
    updateData.resolution = body.resolution.trim()
  }

  if (typeof body.assigned_to === "string" && body.assigned_to.trim()) {
    updateData.assigned_to = body.assigned_to.trim()
  }

  if (typeof body.priority === "string" && ["low", "medium", "high"].includes(body.priority)) {
    updateData.priority = body.priority
  }

  if (Object.keys(updateData).length === 0) {
    res.status(400).json({ message: "No valid fields to update." })
    return
  }

  try {
    const updated = await service.updateObjectionLogs({ id, ...updateData })
    res.status(200).json({ objection: updated })
  } catch (e) {
    res.status(404).json({ message: "Objection log not found." })
  }
}
