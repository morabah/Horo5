import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { ARTIST_MODULE } from "../../../../modules/artist"
import type ArtistModuleService from "../../../../modules/artist/service"

type ArtistRow = {
  slug: string
  name: string
  active?: boolean | null
}

/**
 * Active storefront artists for the Admin product PDP widget (slug + display name).
 * Authenticated admin session only (same as other `/admin/custom/*` reads).
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve<ArtistModuleService>(ARTIST_MODULE)
  const rows = (await service.listArtists({})) as ArtistRow[]
  const active = rows.filter((a) => a.active !== false)
  active.sort((a, b) => String(a.name).localeCompare(String(b.name)))

  res.status(200).json({
    artists: active.map((a) => ({
      slug: String(a.slug || "").trim(),
      name: String(a.name || "").trim() || String(a.slug || "").trim(),
    })).filter((a) => a.slug.length > 0),
  })
}
