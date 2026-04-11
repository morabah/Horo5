import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { SUBFEELING_MODULE } from "../../../../modules/subfeeling"
import type SubfeelingModuleService from "../../../../modules/subfeeling/service"
import { listStorefrontSubfeelings } from "../../../../lib/storefront/catalog"
import { validateTaxonomySlug } from "../../../../lib/storefront/taxonomy-slug"
import { assertTaxonomyAdminWrite } from "../taxonomy-auth"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const subfeelings = await listStorefrontSubfeelings(req.scope)
  res.status(200).json({ subfeelings })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (!assertTaxonomyAdminWrite(req, res)) {
    return
  }

  const body = (req.body || {}) as Record<string, unknown>
  const slug = typeof body.slug === "string" ? body.slug.trim() : ""
  const name = typeof body.name === "string" ? body.name.trim() : ""
  const feeling_slug = typeof body.feeling_slug === "string" ? body.feeling_slug.trim() : ""

  if (!slug || !name || !feeling_slug) {
    res.status(400).json({ message: "slug, name, and feeling_slug are required" })
    return
  }

  const slugError = validateTaxonomySlug(slug)
  if (slugError) {
    res.status(400).json({ message: slugError })
    return
  }

  const service = req.scope.resolve<SubfeelingModuleService>(SUBFEELING_MODULE)
  const duplicate = await service.listSubfeelings({ slug })
  if ((duplicate as Array<{ id?: string }>).length > 0) {
    res.status(409).json({ message: `A subfeeling with slug "${slug}" already exists.` })
    return
  }

  await service.createSubfeelings({
    slug,
    name,
    feeling_slug,
    blurb: typeof body.blurb === "string" ? body.blurb : "",
    card_image_alt: typeof body.card_image_alt === "string" ? body.card_image_alt : null,
    card_image_src: typeof body.card_image_src === "string" ? body.card_image_src : null,
    hero_image_alt: typeof body.hero_image_alt === "string" ? body.hero_image_alt : null,
    hero_image_src: typeof body.hero_image_src === "string" ? body.hero_image_src : null,
    seo_title: typeof body.seo_title === "string" ? body.seo_title : null,
    seo_description: typeof body.seo_description === "string" ? body.seo_description : null,
    sort_order: typeof body.sort_order === "number" ? body.sort_order : 0,
    active: body.active !== false,
  })

  const rows = await service.listSubfeelings({ slug })
  const created = (rows as Array<{ id: string }>)[0]

  res.status(201).json({ id: created?.id, slug })
}
