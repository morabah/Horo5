import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { getOpsHealth } from "../../../../lib/ops-health/checks"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const health = await getOpsHealth(req.scope)
  res.status(200).json({ health })
}
