import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { listStorefrontHomepageSections } from "../../../../lib/storefront/homepage"

function isHomepageDebugEnabled(): boolean {
  return String(process.env.ENABLE_STOREFRONT_DEBUG_ROUTES || "").trim().toLowerCase() === "true"
}

/**
 * GET /store/custom/homepage-debug
 * Active homepage sections with resolved image URLs (ops / release gate).
 * Disabled unless ENABLE_STOREFRONT_DEBUG_ROUTES=true.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  if (!isHomepageDebugEnabled()) {
    res.status(404).json({ message: "Not found" })
    return
  }

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
