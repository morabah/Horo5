import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { listStorefrontHomepageSections } from "../../../../lib/storefront/homepage"

/**
 * GET /store/custom/homepage-debug
 * Active homepage sections with resolved image URLs (ops / release gate).
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const sections = await listStorefrontHomepageSections(req.scope)
  const payload = sections.map((section) => ({
    key: section.key,
    type: section.type,
    sort_order: section.sortOrder,
    active: section.active,
    image_src: section.image?.src ?? null,
    title_en: section.title?.en ?? null,
  }))

  res.json({
    section_count: payload.length,
    sections: payload,
  })
}
