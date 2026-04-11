import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { FEELING_MODULE } from "../../../../../modules/feeling"
import type FeelingModuleService from "../../../../../modules/feeling/service"
import { buildFeeling, type FeelingRecord } from "../../../../../lib/storefront/catalog"
import { countProductsLinkedToFeelingSlug } from "../../../../../lib/storefront/taxonomy-product-links"
import { assertTaxonomyAdminWrite } from "../../taxonomy-auth"
import { applySlugImmutabilityToPatchData } from "../../slug-patch-guard"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const id = req.params?.id as string | undefined

  if (!id) {
    res.status(400).json({ message: "Missing id" })
    return
  }

  const service = req.scope.resolve<FeelingModuleService>(FEELING_MODULE)
  const rows = await service.listFeelings({ id })
  const row = (rows as Array<Record<string, unknown>>)[0]

  if (!row) {
    res.status(404).json({ message: "Not found" })
    return
  }

  const slug = String((row as FeelingRecord).slug || "")
  const linkedProductCount = slug ? await countProductsLinkedToFeelingSlug(req.scope, slug) : 0

  res.status(200).json({
    feeling: buildFeeling(row as FeelingRecord),
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

  const service = req.scope.resolve<FeelingModuleService>(FEELING_MODULE)
  const existingRows = await service.listFeelings({ id })
  const existing = (existingRows as Array<FeelingRecord>)[0]

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
    "tagline",
    "manifesto",
    "accent",
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

  await service.updateFeelings({
    selector: { id },
    data,
  })

  const rows = await service.listFeelings({ id })
  const row = (rows as Array<Record<string, unknown>>)[0]

  res.status(200).json({ feeling: row ? buildFeeling(row as FeelingRecord) : null })
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

  const service = req.scope.resolve<FeelingModuleService>(FEELING_MODULE)
  const rows = await service.listFeelings({ id })
  const existing = (rows as Array<FeelingRecord>)[0]
  const slug = existing?.slug

  if (!slug) {
    res.status(404).json({ message: "Not found" })
    return
  }

  const productCount = await countProductsLinkedToFeelingSlug(req.scope, slug)

  if (productCount > 0) {
    res.status(409).json({
      message: `Cannot archive: ${productCount} product(s) reference this feeling.`,
      productCount,
    })
    return
  }

  await service.updateFeelings({
    selector: { id },
    data: { active: false },
  })

  res.status(204).send()
}
