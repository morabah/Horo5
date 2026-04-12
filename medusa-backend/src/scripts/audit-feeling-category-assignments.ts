import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { FEELINGS_ROOT_HANDLE } from "../lib/storefront/feeling-category-metadata"
import { validateProductFeelingCategoryAssignmentsFlat } from "../lib/storefront/feeling-category-tree"

/**
 * Fails (exit 1) if any product has zero or multiple feeling-branch category assignments.
 * Run after migration and in CI for local/dev validation.
 */
export default async function auditFeelingCategoryAssignments({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: flatCategories } = await query.graph({
    entity: "product_category",
    fields: ["id", "handle", "parent_category_id"],
    pagination: { take: 10000 },
  })

  const categoryById = new Map(
    ((flatCategories || []) as Array<{ id: string; handle: string; parent_category_id?: string | null }>).map(
      (row) => [row.id, row]
    )
  )

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "categories.id"],
    pagination: {
      take: 5000,
    },
  })

  const failures: string[] = []

  for (const row of (products || []) as Array<{
    handle: string
    id: string
    categories?: Array<{ id?: string }> | null
  }>) {
    const ids = (row.categories || []).map((c) => c.id).filter(Boolean) as string[]
    const check = validateProductFeelingCategoryAssignmentsFlat(ids, categoryById, FEELINGS_ROOT_HANDLE)
    if (check.errors.length > 0) {
      failures.push(`${row.handle} (${row.id}): ${check.errors.join(",")}`)
    }
  }

  if (failures.length > 0) {
    // eslint-disable-next-line no-console
    console.error(
      JSON.stringify(
        {
          ok: false,
          count: failures.length,
          failures,
        },
        null,
        2
      )
    )
    process.exitCode = 1
    return
  }

  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ ok: true, checked: (products || []).length }, null, 2))
}
