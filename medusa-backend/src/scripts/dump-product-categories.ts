import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type Row = {
  id: string
  name: string
  handle: string
  is_active?: boolean
  parent_category_id?: string | null
  rank?: number
}

/**
 * Prints all product categories (flat, sorted) for diffing local vs Railway DB.
 * Run: npx medusa exec ./src/scripts/dump-product-categories.ts
 */
export default async function dumpProductCategories({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data } = await query.graph({
    entity: "product_category",
    fields: ["id", "name", "handle", "is_active", "parent_category_id", "rank"],
  })

  const rows = ((data || []) as Row[]).slice().sort((a, b) => {
    const h = a.handle.localeCompare(b.handle)
    return h !== 0 ? h : a.name.localeCompare(b.name)
  })

  const byId = new Map(rows.map((r) => [r.id, r]))

  function pathFor(row: Row): string {
    const parts: string[] = []
    let cur: Row | undefined = row
    let guard = 0
    while (cur && guard++ < 32) {
      parts.unshift(cur.handle)
      const pid = cur.parent_category_id
      cur = pid ? byId.get(pid) : undefined
    }
    return parts.join(" / ")
  }

  const lines = rows.map((r) => ({
    path: pathFor(r),
    name: r.name,
    handle: r.handle,
    active: r.is_active ?? null,
    parent: r.parent_category_id ?? null,
    rank: r.rank ?? null,
  }))

  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ count: rows.length, categories: lines }, null, 2))
}
