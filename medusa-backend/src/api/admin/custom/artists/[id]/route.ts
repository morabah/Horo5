import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { ARTIST_MODULE } from "../../../../../modules/artist"
import type ArtistModuleService from "../../../../../modules/artist/service"
import { applySlugImmutabilityToPatchData } from "../../slug-patch-guard"
import { assertTaxonomyAdminWrite } from "../../taxonomy-auth"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const id = req.params?.id as string | undefined

  if (!id) {
    res.status(400).json({ message: "Missing id" })
    return
  }

  const service = req.scope.resolve<ArtistModuleService>(ARTIST_MODULE)
  const rows = await service.listArtists({ id })
  const existing = rows[0]

  if (!existing) {
    res.status(404).json({ message: "Not found" })
    return
  }

  res.status(200).json({ artist: existing })
}

export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  if (!assertTaxonomyAdminWrite(req, res)) {
    return
  }

  const id = req.params?.id as string | undefined
  const data = req.body as Record<string, unknown>

  if (!id) {
    res.status(400).json({ message: "Missing id" })
    return
  }

  const service = req.scope.resolve<ArtistModuleService>(ARTIST_MODULE)

  const rows = await service.listArtists({ id })
  const existing = rows[0]

  if (!existing) {
    res.status(404).json({ message: "Not found" })
    return
  }

  if (!applySlugImmutabilityToPatchData(res, data, existing.slug as string)) {
    return
  }

  const updated = await service.updateArtists({
    selector: { id },
    data,
  })

  res.status(200).json({ artist: updated[0] })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  if (!assertTaxonomyAdminWrite(req, res)) {
    return
  }

  const id = req.params?.id as string | undefined

  if (!id) {
    res.status(400).json({ message: "Missing id" })
    return
  }

  const service = req.scope.resolve<ArtistModuleService>(ARTIST_MODULE)
  const rows = await service.listArtists({ id })
  const existing = rows[0]

  if (!existing) {
    res.status(404).json({ message: "Not found" })
    return
  }

  await service.updateArtists({
    selector: { id },
    data: { active: false },
  })

  res.status(204).send()
}
