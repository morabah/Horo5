import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"

/**
 * Removes one slug from `metadata.occasionSlugs` and clears `primaryOccasionSlug` when it matched.
 *
 * Run (from medusa-backend):
 *   PRODUCT_HANDLE=emotions-raw-nerve OCCASION_SLUG=just-because npm run clear:product-occasion-slug
 */
export default async function clearProductOccasionSlug({ container }: ExecArgs) {
  const handle = (process.env.PRODUCT_HANDLE || "").trim()
  const removeSlug = (process.env.OCCASION_SLUG || "").trim().toLowerCase()

  if (!handle || !removeSlug) {
    // eslint-disable-next-line no-console
    console.error("Set PRODUCT_HANDLE and OCCASION_SLUG (e.g. OCCASION_SLUG=just-because).")
    process.exitCode = 1
    return
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "metadata"],
    filters: { handle },
  })

  const row = (data as Array<{ id: string; handle?: string; metadata?: Record<string, unknown> }> | undefined)?.[0]

  if (!row) {
    // eslint-disable-next-line no-console
    console.error(`No product with handle: ${handle}`)
    process.exitCode = 1
    return
  }

  const meta: Record<string, unknown> = { ...(row.metadata || {}) }
  const raw = meta.occasionSlugs
  const slugs = Array.isArray(raw) ? raw.map((s) => String(s).trim()).filter(Boolean) : []
  const nextSlugs = slugs.filter((s) => s.toLowerCase() !== removeSlug)

  if (nextSlugs.length === slugs.length) {
    // eslint-disable-next-line no-console
    console.error(`Slug "${removeSlug}" not found in metadata.occasionSlugs: ${JSON.stringify(raw)}`)
    process.exitCode = 1
    return
  }

  if (nextSlugs.length) {
    meta.occasionSlugs = nextSlugs
  } else {
    delete meta.occasionSlugs
  }

  const primary = String(meta.primaryOccasionSlug || "").trim()

  if (primary.toLowerCase() === removeSlug) {
    meta.primaryOccasionSlug = nextSlugs[0] ?? undefined

    if (meta.primaryOccasionSlug === undefined) {
      delete meta.primaryOccasionSlug
    }
  }

  await updateProductsWorkflow(container).run({
    input: {
      selector: { id: row.id },
      update: { metadata: meta },
    },
  })

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        handle: row.handle,
        removed: removeSlug,
        metadata_occasionSlugs: meta.occasionSlugs,
        metadata_primaryOccasionSlug: meta.primaryOccasionSlug,
      },
      null,
      2
    )
  )
}
