import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createProductCategoriesWorkflow } from "@medusajs/medusa/core-flows"

type Cat = { name: string; handle: string; is_active: boolean; rank: number; parent_handle?: string }

/**
 * HORO Admin "taxonomy" product categories (Feelings / Moments trees) — matches typical local Admin setup.
 * Not part of seed-egypt-catalog; use this so Railway matches localhost /app/categories.
 *
 * Idempotent: creates missing categories only (by handle).
 */
const ROOTS: Cat[] = [
  { name: "Feelings", handle: "taxonomy-feelings", is_active: true, rank: 0 },
  { name: "Moments", handle: "taxonomy-moments", is_active: true, rank: 1 },
]

const UNDER_FEELINGS: Cat[] = [
  { name: "Playful / Offbeat", handle: "feeling-playful-offbeat", is_active: true, rank: 0, parent_handle: "taxonomy-feelings" },
  { name: "Warm / Romantic", handle: "feeling-warm-romantic", is_active: true, rank: 1, parent_handle: "taxonomy-feelings" },
  { name: "Soft / Quiet", handle: "feeling-soft-quiet", is_active: true, rank: 2, parent_handle: "taxonomy-feelings" },
  { name: "Grounded / Everyday", handle: "feeling-grounded-everyday", is_active: true, rank: 3, parent_handle: "taxonomy-feelings" },
  { name: "Bold / Electric", handle: "feeling-bold-electric", is_active: true, rank: 4, parent_handle: "taxonomy-feelings" },
]

const UNDER_MOMENTS: Cat[] = [
  { name: "Gift Something Real", handle: "moment-gift-something-real", is_active: true, rank: 0, parent_handle: "taxonomy-moments" },
  { name: "Graduation Season", handle: "moment-graduation-season", is_active: true, rank: 1, parent_handle: "taxonomy-moments" },
  { name: "Eid & Ramadan", handle: "moment-eid-and-ramadan", is_active: true, rank: 2, parent_handle: "taxonomy-moments" },
  { name: "Birthday Pick", handle: "moment-birthday-pick", is_active: true, rank: 3, parent_handle: "taxonomy-moments" },
  { name: "Just Because", handle: "moment-just-because", is_active: true, rank: 4, parent_handle: "taxonomy-moments" },
]

async function existingIdsByHandle(
  query: { graph: (q: Record<string, unknown>) => Promise<{ data?: unknown }> },
  handles: string[]
) {
  const map = new Map<string, string>()
  for (const handle of handles) {
    const { data } = await query.graph({
      entity: "product_category",
      fields: ["id", "handle"],
      filters: { handle },
    })
    const row = (data as Array<{ id: string; handle: string }> | undefined)?.[0]
    if (row) {
      map.set(handle, row.id)
    }
  }
  return map
}

export default async function ensureHoroTaxonomyProductCategories({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const allHandles = [
    ...ROOTS.map((r) => r.handle),
    ...UNDER_FEELINGS.map((r) => r.handle),
    ...UNDER_MOMENTS.map((r) => r.handle),
  ]

  let idByHandle = await existingIdsByHandle(query, allHandles)
  const created: string[] = []

  const createBatch = async (batch: Cat[]) => {
    const input = batch
      .filter((c) => !idByHandle.has(c.handle))
      .map((c) => {
        const base: Record<string, unknown> = {
          name: c.name,
          handle: c.handle,
          is_active: c.is_active,
          rank: c.rank,
        }
        if (c.parent_handle) {
          const pid = idByHandle.get(c.parent_handle)
          if (!pid) {
            throw new Error(`Missing parent category "${c.parent_handle}" for "${c.handle}"`)
          }
          base.parent_category_id = pid
        }
        return base
      })

    if (!input.length) {
      return
    }

    const { result } = await createProductCategoriesWorkflow(container).run({
      input: { product_categories: input as never },
    })

    for (const row of result as Array<{ id: string; handle: string }>) {
      idByHandle.set(row.handle, row.id)
      created.push(row.handle)
    }
  }

  await createBatch(ROOTS)
  idByHandle = await existingIdsByHandle(query, allHandles)
  await createBatch([...UNDER_FEELINGS, ...UNDER_MOMENTS])

  if (!created.length) {
    logger.info("HORO taxonomy product categories already present — nothing to create.")
  } else {
    logger.info(`Created HORO taxonomy categories: ${created.join(", ")}`)
  }
}
