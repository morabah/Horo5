import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { retrieveStorefrontProduct } from "../lib/storefront/catalog"

/**
 * Prints Medusa fields that drive storefront PDP category chips vs metadata.
 * `storefrontPdpTagLabels` matches **Organize → Categories** only (feelings root excluded).
 *
 * Run (from medusa-backend):
 *   PRODUCT_HANDLE=emotions-raw-nerve npx medusa exec ./src/scripts/print-product-pdp-fields.ts
 */
export default async function printProductPdpFields({ container }: ExecArgs) {
  const handle = (process.env.PRODUCT_HANDLE || "emotions-raw-nerve").trim()
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "title", "metadata", "categories.handle", "categories.name"],
    filters: { handle },
  })

  const row = (data as Array<Record<string, unknown>> | undefined)?.[0]
  if (!row) {
    // eslint-disable-next-line no-console
    console.error(`No product with handle: ${handle}`)
    process.exitCode = 1
    return
  }

  const meta = (row.metadata || null) as Record<string, unknown> | null
  const cats = (row.categories || []) as Array<{ handle?: string; name?: string }>

  let storefrontPdpTagLabels: string[] | undefined
  try {
    const dto = await retrieveStorefrontProduct(container, handle)
    storefrontPdpTagLabels = dto?.pdpTagLabels
  } catch {
    storefrontPdpTagLabels = undefined
  }

  const out = {
    handle: row.handle,
    title: row.title,
    adminCategoryHandles: cats.map((c) => c.handle).filter((h): h is string => Boolean(h)),
    metadata_occasionSlugs: meta?.occasionSlugs,
    metadata_primaryOccasionSlug: meta?.primaryOccasionSlug,
    metadata_primaryFeelingSlug: meta?.primaryFeelingSlug,
    metadata_feelingSlug: meta?.feelingSlug,
    storefrontPdpTagLabels,
    hint:
      "PDP category chip row uses `storefrontPdpTagLabels`: linked product category names only (Admin → Organize → Categories; feelings root excluded). `metadata.occasionSlugs` is not shown in that row.",
  }

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(out, null, 2))
}
