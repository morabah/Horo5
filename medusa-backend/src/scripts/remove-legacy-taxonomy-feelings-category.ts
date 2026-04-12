import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  batchLinkProductsToCategoryWorkflow,
  deleteProductCategoriesWorkflow,
} from "@medusajs/medusa/core-flows"

import { LEGACY_TAXONOMY_FEELINGS_HANDLE } from "../lib/storefront/feeling-category-metadata"

type FlatCat = { id: string; parent_category_id?: string | null }

/**
 * Unlinks all products from the legacy `taxonomy-feelings` subtree and soft-deletes those categories.
 * Safe to re-run if the legacy root is already gone (no-op).
 */
export default async function removeLegacyTaxonomyFeelingsCategory({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: rootRows } = await query.graph({
    entity: "product_category",
    fields: ["id", "handle"],
    filters: { handle: LEGACY_TAXONOMY_FEELINGS_HANDLE },
  })

  const root = (rootRows as Array<{ id: string; handle: string }> | undefined)?.[0]
  if (!root) {
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify(
        {
          removed: false,
          reason: `No category with handle "${LEGACY_TAXONOMY_FEELINGS_HANDLE}" — nothing to delete.`,
        },
        null,
        2
      )
    )
    return
  }

  const { data: allCategories } = await query.graph({
    entity: "product_category",
    fields: ["id", "parent_category_id"],
    pagination: { take: 20000 },
  })

  const rows = (allCategories || []) as FlatCat[]

  const childrenByParent = new Map<string | null, string[]>()
  for (const row of rows) {
    const p = row.parent_category_id ?? null
    const list = childrenByParent.get(p) || []
    list.push(row.id)
    childrenByParent.set(p, list)
  }

  const subtreeIds = new Set<string>()
  const stack = [root.id]
  while (stack.length) {
    const id = stack.pop()!
    subtreeIds.add(id)
    const next = childrenByParent.get(id) || []
    stack.push(...next)
  }

  const depth = new Map<string, number>()
  const queue: string[] = [root.id]
  depth.set(root.id, 0)
  while (queue.length) {
    const id = queue.shift()!
    const d = depth.get(id) ?? 0
    for (const c of childrenByParent.get(id) || []) {
      if (!subtreeIds.has(c)) {
        continue
      }
      depth.set(c, d + 1)
      queue.push(c)
    }
  }

  const deleteOrder = [...subtreeIds].sort((a, b) => (depth.get(b) ?? 0) - (depth.get(a) ?? 0))

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "categories.id"],
    pagination: { take: 10000 },
  })

  let unlinked = 0
  for (const row of (products || []) as Array<{
    id: string
    handle: string
    categories?: Array<{ id?: string }> | null
  }>) {
    const catIds = (row.categories || []).map((c) => c.id).filter(Boolean) as string[]
    const toRemove = catIds.filter((id) => subtreeIds.has(id))
    if (toRemove.length === 0) {
      continue
    }

    for (const cid of toRemove) {
      await batchLinkProductsToCategoryWorkflow(container).run({
        input: {
          id: cid,
          add: [],
          remove: [row.id],
        },
      })
    }
    unlinked += 1
  }

  for (const id of deleteOrder) {
    await deleteProductCategoriesWorkflow(container).run({
      input: [id],
    })
  }

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        removed: true,
        legacyHandle: LEGACY_TAXONOMY_FEELINGS_HANDLE,
        deletedCategoryCount: deleteOrder.length,
        productsTouched: unlinked,
        deletedCategoryIds: deleteOrder,
      },
      null,
      2
    )
  )
}
