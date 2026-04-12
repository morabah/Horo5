import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createProductCategoriesWorkflow } from "@medusajs/medusa/core-flows"

/**
 * Creates the same root product categories as `src/scripts/seed.ts` (Medusa demo):
 * Shirts, Sweatshirts, Pants, Merch — without touching store currency, regions, or demo products.
 *
 * Idempotent: skips categories that already exist (by exact name).
 *
 * Run: npx medusa exec ./src/scripts/ensure-demo-product-categories.ts
 */
const DEMO_ROOT_CATEGORIES = [
  { name: "Shirts", is_active: true },
  { name: "Sweatshirts", is_active: true },
  { name: "Pants", is_active: true },
  { name: "Merch", is_active: true },
] as const

export default async function ensureDemoProductCategories({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const missing: Array<{ name: string; is_active: boolean }> = []

  for (const row of DEMO_ROOT_CATEGORIES) {
    const { data } = await query.graph({
      entity: "product_category",
      fields: ["id"],
      filters: { name: row.name },
    })

    if (!data?.length) {
      missing.push({ name: row.name, is_active: row.is_active })
    }
  }

  if (!missing.length) {
    logger.info("Demo product categories (Shirts, Sweatshirts, Pants, Merch) already exist — nothing to do.")
    return
  }

  const { result } = await createProductCategoriesWorkflow(container).run({
    input: { product_categories: missing },
  })

  logger.info(
    `Created ${(result as Array<{ name?: string }>).length} demo product categories: ${missing.map((m) => m.name).join(", ")}`
  )
}
