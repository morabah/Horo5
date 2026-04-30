import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { getBulkOpAction, runBulkOpAction } from "../../../../../lib/bulk-ops/actions"
import type { BulkOpActionId } from "../../../../../lib/bulk-ops/types"
import { assertTaxonomyAdminWrite } from "../../taxonomy-auth"

function parseDryRun(value: unknown): boolean {
  if (Array.isArray(value)) {
    return parseDryRun(value[0])
  }
  if (typeof value !== "string") {
    return false
  }
  return ["1", "true", "yes", "dryrun"].includes(value.trim().toLowerCase())
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (!assertTaxonomyAdminWrite(req, res)) {
    return
  }

  const action = req.params?.action as string | undefined
  if (!action) {
    res.status(400).json({ message: "Missing action." })
    return
  }

  const definition = getBulkOpAction(action)
  if (!definition) {
    res.status(404).json({ message: `Unknown bulk operation action: ${action}` })
    return
  }

  const dryRun = parseDryRun(req.query.dryRun)
  const startedAt = new Date().toISOString()

  try {
    const body = (req.body || {}) as Record<string, unknown>
    const result = await runBulkOpAction(definition.id as BulkOpActionId, req.scope, {
      ...body,
      dryRun,
    })
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({
      ok: false,
      action,
      dryRun,
      summary: error instanceof Error ? error.message : String(error),
      startedAt,
      completedAt: new Date().toISOString(),
    })
  }
}
