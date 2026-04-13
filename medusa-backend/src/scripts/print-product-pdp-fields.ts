import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * Prints Medusa fields that drive storefront PDP chips (feeling vs occasion).
 * Use this to verify `metadata.occasionSlugs` after Admin edits — it is separate
 * from **Organize → Categories** on the product.
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

  const out = {
    handle: row.handle,
    title: row.title,
    adminCategoryHandles: cats.map((c) => c.handle).filter((h): h is string => Boolean(h)),
    metadata_occasionSlugs: meta?.occasionSlugs,
    metadata_primaryOccasionSlug: meta?.primaryOccasionSlug,
    metadata_primaryFeelingSlug: meta?.primaryFeelingSlug,
    metadata_feelingSlug: meta?.feelingSlug,
    hint:
      "White occasion pills on the PDP use metadata.occasionSlugs (slug list). Purple feeling pill uses primary feeling fields + category graph in storefront buildProduct — not the same as product categories in Admin.",
  }

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(out, null, 2))
}
