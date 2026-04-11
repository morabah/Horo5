import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { OCCASION_MODULE } from "../../../../modules/occasion"
import type OccasionModuleService from "../../../../modules/occasion/service"
import { listStorefrontOccasions } from "../../../../lib/storefront/catalog"
import { validateTaxonomySlug } from "../../../../lib/storefront/taxonomy-slug"
import { assertTaxonomyAdminWrite } from "../taxonomy-auth"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const occasions = await listStorefrontOccasions(req.scope)
  res.status(200).json({ occasions })
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

  const service = req.scope.resolve<OccasionModuleService>(OCCASION_MODULE)
  const duplicate = await service.listOccasions({ slug })
  if ((duplicate as Array<{ id?: string }>).length > 0) {
    res.status(409).json({ message: `An occasion with slug "${slug}" already exists.` })
    return
  }

  await service.createOccasions({
    slug,
    name,
    blurb: typeof body.blurb === "string" ? body.blurb : "",
    accent: typeof body.accent === "string" ? body.accent : null,
    card_image_alt: typeof body.card_image_alt === "string" ? body.card_image_alt : null,
    card_image_src: typeof body.card_image_src === "string" ? body.card_image_src : null,
    hero_image_alt: typeof body.hero_image_alt === "string" ? body.hero_image_alt : null,
    hero_image_src: typeof body.hero_image_src === "string" ? body.hero_image_src : null,
    is_gift_occasion: Boolean(body.is_gift_occasion),
    price_hint: typeof body.price_hint === "string" ? body.price_hint : null,
    seo_title: typeof body.seo_title === "string" ? body.seo_title : null,
    seo_description: typeof body.seo_description === "string" ? body.seo_description : null,
    sort_order: typeof body.sort_order === "number" ? body.sort_order : 0,
    active: body.active !== false,
    product_handles: Array.isArray(body.product_handles) ? body.product_handles : [],
  })

  const rows = await service.listOccasions({ slug })
  const created = (rows as Array<{ id: string }>)[0]

  res.status(201).json({ id: created?.id, slug })
}
