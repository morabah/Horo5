import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { FEELING_MODULE } from "../../../../modules/feeling"
import type FeelingModuleService from "../../../../modules/feeling/service"
import { listStorefrontFeelings } from "../../../../lib/storefront/catalog"
import { validateTaxonomySlug } from "../../../../lib/storefront/taxonomy-slug"
import { assertTaxonomyAdminWrite } from "../taxonomy-auth"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const feelings = await listStorefrontFeelings(req.scope)
  res.status(200).json({ feelings })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (!assertTaxonomyAdminWrite(req, res)) {
    return
  }

  const body = (req.body || {}) as Record<string, unknown>
  const slug = typeof body.slug === "string" ? body.slug.trim() : ""
  const name = typeof body.name === "string" ? body.name.trim() : ""

  if (!slug || !name) {
    res.status(400).json({ message: "slug and name are required" })
    return
  }

  const slugError = validateTaxonomySlug(slug)
  if (slugError) {
    res.status(400).json({ message: slugError })
    return
  }

  const service = req.scope.resolve<FeelingModuleService>(FEELING_MODULE)
  const duplicate = await service.listFeelings({ slug })
  if ((duplicate as Array<{ id?: string }>).length > 0) {
    res.status(409).json({ message: `A feeling with slug "${slug}" already exists.` })
    return
  }

  await service.createFeelings({
    slug,
    name,
    blurb: typeof body.blurb === "string" ? body.blurb : "",
    tagline: typeof body.tagline === "string" ? body.tagline : null,
    manifesto: typeof body.manifesto === "string" ? body.manifesto : null,
    accent: typeof body.accent === "string" ? body.accent : null,
    card_image_alt: typeof body.card_image_alt === "string" ? body.card_image_alt : null,
    card_image_src: typeof body.card_image_src === "string" ? body.card_image_src : null,
    hero_image_alt: typeof body.hero_image_alt === "string" ? body.hero_image_alt : null,
    hero_image_src: typeof body.hero_image_src === "string" ? body.hero_image_src : null,
    seo_title: typeof body.seo_title === "string" ? body.seo_title : null,
    seo_description: typeof body.seo_description === "string" ? body.seo_description : null,
    sort_order: typeof body.sort_order === "number" ? body.sort_order : 0,
    active: body.active !== false,
  })

  const feelings = await service.listFeelings({ slug })
  const created = (feelings as Array<{ id: string }>)[0]

  res.status(201).json({ id: created?.id, slug })
}
