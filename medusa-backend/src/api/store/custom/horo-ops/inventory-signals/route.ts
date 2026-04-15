import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { assertOpsBackendAccess } from "../../../../../lib/horo-ops-backend-auth"
import { listHoroLowStockEvents } from "../../../../../lib/horo-ops-low-stock-memory"

/** Recent low-stock inventory signals (in-process buffer; best-effort on single Medusa instance). */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  if (!assertOpsBackendAccess(req, res)) return
  res.status(200).json({ events: listHoroLowStockEvents() })
}
