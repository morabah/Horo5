import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { ARTIST_MODULE } from "../../../../modules/artist"
import type ArtistModuleService from "../../../../modules/artist/service"
import { validateTaxonomySlug } from "../../../../lib/storefront/taxonomy-slug"
import { assertTaxonomyAdminWrite } from "../taxonomy-auth"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve<ArtistModuleService>(ARTIST_MODULE)

  const skip = parseInt(req.query.skip as string) || 0
  const limit = parseInt(req.query.limit as string) || 100

  const [rows, count] = await service.listAndCountArtists({}, { skip, take: limit })

  res.status(200).json({
    artists: rows,
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
  const slug = typeof data.slug === "string" ? data.slug.trim() : ""
  const name = typeof data.name === "string" ? data.name.trim() : ""

  if (!slug || !name) {
    res.status(400).json({ message: "Missing required fields" })
    return
  }

  const slugError = validateTaxonomySlug(slug)
  if (slugError) {
    res.status(400).json({ message: slugError })
    return
  }

  const service = req.scope.resolve<ArtistModuleService>(ARTIST_MODULE)

  const existingBySlug = await service.listArtists({ slug })
  if (existingBySlug.length > 0) {
    res.status(409).json({ message: "An artist with this slug already exists" })
    return
  }

  const created = await service.createArtists({
    active: data.active !== false,
    avatar_src: typeof data.avatar_src === "string" ? data.avatar_src : null,
    design_count: typeof data.design_count === "number" ? data.design_count : 0,
    name,
    slug,
    style: typeof data.style === "string" ? data.style : "",
  })
  res.status(201).json({ artist: created })
}
