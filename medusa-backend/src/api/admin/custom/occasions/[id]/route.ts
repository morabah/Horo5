import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { OCCASION_MODULE } from "../../../../../modules/occasion"
import type OccasionModuleService from "../../../../../modules/occasion/service"
import { buildOccasion, type OccasionRecord } from "../../../../../lib/storefront/catalog"
import { countProductsLinkedToOccasionSlug } from "../../../../../lib/storefront/taxonomy-product-links"
import { assertTaxonomyAdminWrite } from "../../taxonomy-auth"
import { applySlugImmutabilityToPatchData } from "../../slug-patch-guard"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const id = req.params?.id as string | undefined

  if (!id) {
    res.status(400).json({ message: "Missing id" })
    return
  }

  const service = req.scope.resolve<OccasionModuleService>(OCCASION_MODULE)
  const rows = await service.listOccasions({ id })
  const row = (rows as Array<Record<string, unknown>>)[0]

  if (!row) {
    res.status(404).json({ message: "Not found" })
    return
  }

  const slug = String((row as OccasionRecord).slug || "")
  const linkedProductCount = slug ? await countProductsLinkedToOccasionSlug(req.scope, slug) : 0

  res.status(200).json({
    occasion: buildOccasion(row as OccasionRecord),
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

  const service = req.scope.resolve<OccasionModuleService>(OCCASION_MODULE)
  const existingRows = await service.listOccasions({ id })
  const existing = (existingRows as Array<OccasionRecord>)[0]

  if (!existing?.slug) {
    res.status(404).json({ message: "Not found" })
    return
  }

  const body = (req.body || {}) as Record<string, unknown>

  const data: Record<string, unknown> = {}

  for (const key of [
    "slug",
    "name",
    "blurb",
    "accent",
    "card_image_alt",
    "card_image_src",
    "hero_image_alt",
    "hero_image_src",
    "is_gift_occasion",
    "price_hint",
    "seo_title",
    "seo_description",
    "sort_order",
    "active",
    "product_handles",
  ] as const) {
    if (key in body) {
      data[key] = body[key]
    }
  }

  if (!applySlugImmutabilityToPatchData(res, data, existing.slug)) {
    return
  }

  await service.updateOccasions({
    selector: { id },
    data,
  })

  const rows = await service.listOccasions({ id })
  const row = (rows as Array<Record<string, unknown>>)[0]

  res.status(200).json({ occasion: row ? buildOccasion(row as OccasionRecord) : null })
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

  const service = req.scope.resolve<OccasionModuleService>(OCCASION_MODULE)
  const rows = await service.listOccasions({ id })
  const existing = (rows as Array<OccasionRecord>)[0]
  const slug = existing?.slug

  if (!slug) {
    res.status(404).json({ message: "Not found" })
    return
  }

  const productCount = await countProductsLinkedToOccasionSlug(req.scope, slug)

  if (productCount > 0) {
    res.status(409).json({
      message: `Cannot archive: ${productCount} product(s) reference this occasion.`,
      productCount,
    })
    return
  }

  await service.updateOccasions({
    selector: { id },
    data: { active: false },
  })

  res.status(204).send()
}
