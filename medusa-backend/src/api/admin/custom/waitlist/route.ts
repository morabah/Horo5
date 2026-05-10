import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { WAITLIST_MODULE } from "../../../../modules/waitlist"
import type WaitlistModuleService from "../../../../modules/waitlist/service"
import { assertTaxonomyAdminWrite } from "../taxonomy-auth"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve<WaitlistModuleService>(WAITLIST_MODULE)

  const skip = parseInt(req.query.skip as string) || 0
  const limit = parseInt(req.query.limit as string) || 100
  const unsubscribed = req.query.unsubscribed === "true"

  const filters: Record<string, unknown> = {}
  if (unsubscribed) {
    filters.unsubscribed_at = { $ne: null }
  } else {
    filters.unsubscribed_at = null
  }

  const [rows, count] = await service.listAndCountWaitlists(filters, { skip, take: limit })

  res.status(200).json({
    waitlists: rows,
    count,
    offset: skip,
    limit,
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (!assertTaxonomyAdminWrite(req, res)) {
    return
  }

  const data = (req.body || {}) as Record<string, unknown>
  const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : ""

  if (!email) {
    res.status(400).json({ message: "Email is required" })
    return
  }

  const service = req.scope.resolve<WaitlistModuleService>(WAITLIST_MODULE)

  const existing = await service.listWaitlists({ email }, { take: 1 })
  const row = existing[0]

  if (!row) {
    res.status(404).json({ message: "Waitlist entry not found" })
    return
  }

  await service.updateWaitlists({
    selector: { id: row.id },
    data: { unsubscribed_at: new Date() },
  })
  res.status(200).json({ ok: true })
}
