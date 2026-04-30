import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { revalidateStorefrontForDrop } from "../../../../../lib/drops/revalidate-storefront"
import { reorderHomepageSections } from "../../../../../lib/homepage-sections/admin"
import type { HomepageSectionReorderItem } from "../../../../../lib/homepage-sections/types"
import { clearStorefrontHomepageCache } from "../../../../../lib/storefront/homepage"
import { assertTaxonomyAdminWrite } from "../../taxonomy-auth"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (!assertTaxonomyAdminWrite(req, res)) {
    return
  }

  const body = (req.body || {}) as { items?: HomepageSectionReorderItem[] }
  const items = body.items

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ message: "items array is required." })
    return
  }

  for (const item of items) {
    if (!item?.id || !Number.isFinite(Number(item.sort_order))) {
      res.status(400).json({ message: "Each item needs id and numeric sort_order." })
      return
    }
  }

  const result = await reorderHomepageSections(req.scope, items)
  clearStorefrontHomepageCache()
  revalidateStorefrontForDrop("*")
  res.status(200).json(result)
}
