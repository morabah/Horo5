import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { revalidateStorefrontForDrop } from "../../../../../lib/drops/revalidate-storefront"
import {
  adminHomepageSectionToInput,
  homepageSectionInputToRecord,
  normalizeHomepageSectionInput,
  retrieveAdminHomepageSection,
} from "../../../../../lib/homepage-sections/admin"
import type { HomepageSectionInput } from "../../../../../lib/homepage-sections/types"
import { clearStorefrontHomepageCache } from "../../../../../lib/storefront/homepage"
import { HOMEPAGE_SECTION_MODULE } from "../../../../../modules/homepage-section"
import type HomepageSectionModuleService from "../../../../../modules/homepage-section/service"
import { assertTaxonomyAdminWrite } from "../../taxonomy-auth"

export async function GET(req: MedusaRequest<{ id: string }>, res: MedusaResponse) {
  const id = req.params.id
  if (!id) {
    res.status(400).json({ message: "Missing id." })
    return
  }

  const section = await retrieveAdminHomepageSection(req.scope, id)
  if (!section) {
    res.status(404).json({ message: "Homepage section not found." })
    return
  }

  res.status(200).json({ section })
}

export async function PATCH(req: MedusaRequest<{ id: string }>, res: MedusaResponse) {
  if (!assertTaxonomyAdminWrite(req, res)) {
    return
  }

  const id = req.params.id
  if (!id) {
    res.status(400).json({ message: "Missing id." })
    return
  }

  const existing = await retrieveAdminHomepageSection(req.scope, id)
  if (!existing) {
    res.status(404).json({ message: "Homepage section not found." })
    return
  }

  const body = (req.body || {}) as HomepageSectionInput
  if (typeof body.key === "string" && body.key.trim() && body.key.trim() !== existing.key) {
    res.status(422).json({ message: "Section key cannot be changed after creation." })
    return
  }

  const merged = { ...adminHomepageSectionToInput(existing), ...body, key: existing.key }
  const normalized = normalizeHomepageSectionInput(merged, "update")
  if (!normalized.ok) {
    res.status(400).json({ message: "Invalid homepage section input.", issues: normalized.issues })
    return
  }

  const data = homepageSectionInputToRecord(normalized.data)
  delete data.key

  const service = req.scope.resolve<HomepageSectionModuleService>(HOMEPAGE_SECTION_MODULE)
  await service.updateHomepageSections({
    selector: { id: existing.id },
    data,
  })

  const section = await retrieveAdminHomepageSection(req.scope, existing.id)
  clearStorefrontHomepageCache()
  revalidateStorefrontForDrop("*")
  res.status(200).json({ section })
}

export async function DELETE(req: MedusaRequest<{ id: string }>, res: MedusaResponse) {
  if (!assertTaxonomyAdminWrite(req, res)) {
    return
  }

  const id = req.params.id
  if (!id) {
    res.status(400).json({ message: "Missing id." })
    return
  }

  const existing = await retrieveAdminHomepageSection(req.scope, id)
  if (!existing) {
    res.status(404).json({ message: "Homepage section not found." })
    return
  }

  const service = req.scope.resolve<HomepageSectionModuleService>(HOMEPAGE_SECTION_MODULE)
  await service.updateHomepageSections({
    selector: { id: existing.id },
    data: { active: false },
  })

  clearStorefrontHomepageCache()
  revalidateStorefrontForDrop("*")
  res.status(204).send()
}
