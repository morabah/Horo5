import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { getAdminDropLookups } from "../../../../../lib/drops/admin"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const lookups = await getAdminDropLookups(req.scope)
  res.status(200).json(lookups)
}
