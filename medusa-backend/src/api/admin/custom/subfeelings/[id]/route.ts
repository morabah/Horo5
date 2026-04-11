import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { SUBFEELING_MODULE } from "../../../../../modules/subfeeling"
import type SubfeelingModuleService from "../../../../../modules/subfeeling/service"
import { buildSubfeeling, type SubfeelingRecord } from "../../../../../lib/storefront/catalog"
import { countProductsLinkedToSubfeelingSlug } from "../../../../../lib/storefront/taxonomy-product-links"
import { assertTaxonomyAdminWrite } from "../../taxonomy-auth"
import { applySlugImmutabilityToPatchData } from "../../slug-patch-guard"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const id = req.params?.id as string | undefined

  if (!id) {
    res.status(400).json({ message: "Missing id" })
    return
  }

  const service = req.scope.resolve<SubfeelingModuleService>(SUBFEELING_MODULE)
  const rows = await service.listSubfeelings({ id })
  const row = (rows as Array<Record<string, unknown>>)[0]

  if (!row) {
    res.status(404).json({ message: "Not found" })
    return
  }

  const slug = String((row as SubfeelingRecord).slug || "")
  const linkedProductCount = slug ? await countProductsLinkedToSubfeelingSlug(req.scope, slug) : 0

  res.status(200).json({
    subfeeling: buildSubfeeling(row as SubfeelingRecord),
    linkedProductCount,
  })
}

export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  if (!assertTaxonomyAdminWrite(req, res)) {
    return
  }

  const id = req.params?.id as string | undefined

  if (!id) {
    res.status(400).json({ message: "Missing id" })
    return
  }

  const service = req.scope.resolve<SubfeelingModuleService>(SUBFEELING_MODULE)
  const existingRows = await service.listSubfeelings({ id })
  const existing = (existingRows as Array<SubfeelingRecord>)[0]

  if (!existing?.slug) {
    res.status(404).json({ message: "Not found" })
    return
  }

  const body = (req.body || {}) as Record<string, unknown>

  const data: Record<string, unknown> = {}

  for (const key of [
    "slug",
    "name",
    "feeling_slug",
    "blurb",
    "card_image_alt",
    "card_image_src",
    "hero_image_alt",
    "hero_image_src",
    "seo_title",
    "seo_description",
    "sort_order",
    "active",
  ] as const) {
    if (key in body) {
      data[key] = body[key]
    }
  }

  if (!applySlugImmutabilityToPatchData(res, data, existing.slug)) {
    return
  }

  await service.updateSubfeelings({
    selector: { id },
    data,
  })

  const rows = await service.listSubfeelings({ id })
  const row = (rows as Array<Record<string, unknown>>)[0]

  res.status(200).json({ subfeeling: row ? buildSubfeeling(row as SubfeelingRecord) : null })
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

  const service = req.scope.resolve<SubfeelingModuleService>(SUBFEELING_MODULE)
  const rows = await service.listSubfeelings({ id })
  const existing = (rows as Array<SubfeelingRecord>)[0]
  const slug = existing?.slug

  if (!slug) {
    res.status(404).json({ message: "Not found" })
    return
  }

  const productCount = await countProductsLinkedToSubfeelingSlug(req.scope, slug)

  if (productCount > 0) {
    res.status(409).json({
      message: `Cannot archive: ${productCount} product(s) reference this subfeeling.`,
      productCount,
    })
    return
  }

  await service.updateSubfeelings({
    selector: { id },
    data: { active: false },
  })

  res.status(204).send()
}
