import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { upsertDrop } from "../../../../../lib/drops/upsert-drop"
import type { UpsertDropPayload } from "../../../../../lib/drops/types"
import { DropValidationError } from "../../../../../lib/drops/validate"
import { assertTaxonomyAdminWrite } from "../../taxonomy-auth"

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = []
  let nextIndex = 0

  async function run() {
    while (nextIndex < items.length) {
      const index = nextIndex++
      results[index] = await worker(items[index], index)
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run))
  return results
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (!assertTaxonomyAdminWrite(req, res)) {
    return
  }

  const body = (req.body || {}) as { drops?: UpsertDropPayload[]; concurrency?: number }
  const drops = Array.isArray(body.drops) ? body.drops : []
  const concurrency = Math.min(Math.max(Number(body.concurrency || 4), 1), 8)

  if (!drops.length) {
    res.status(400).json({ message: "drops must contain at least one payload." })
    return
  }

  const results = await mapLimit(drops, concurrency, async (drop, index) => {
    try {
      const result = await upsertDrop(req.scope, drop)
      return { index, handle: drop.handle, ok: true, drop: result }
    } catch (error) {
      return {
        index,
        handle: drop.handle,
        ok: false,
        message: error instanceof Error ? error.message : String(error),
        issues: error instanceof DropValidationError ? error.issues : undefined,
      }
    }
  })

  res.status(207).json({ results })
}
