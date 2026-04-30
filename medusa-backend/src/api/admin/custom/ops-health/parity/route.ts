import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { getParityDetail } from "../../../../../lib/ops-health/checks"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const detail = await getParityDetail(req.scope)
  res.status(200).json({ detail })
}
