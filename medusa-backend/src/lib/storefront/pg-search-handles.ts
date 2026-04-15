import type { Pool } from "pg"

import { getStorefrontPgPool } from "./pg-pool"

/**
 * Returns product handles whose title/description/handle contain `q` (case-insensitive).
 * Uses the same substring semantics as the legacy in-memory storefront search for `q`.
 */
export async function searchStorefrontProductHandlesBySubstring(qRaw: string): Promise<Set<string>> {
  const q = qRaw.trim().toLowerCase()
  if (!q) {
    return new Set()
  }
  const pool = getStorefrontPgPool()
  if (!pool) {
    return new Set()
  }
  return searchProductHandlesWithPool(pool, q)
}

export async function searchProductHandlesWithPool(pool: Pool, qLower: string): Promise<Set<string>> {
  const res = await pool.query<{ handle: string }>(
    `
    SELECT handle
    FROM product
    WHERE deleted_at IS NULL
      AND lower(
            coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(handle, '') || ' ' ||
            coalesce(metadata->>'story', '')
          )
          LIKE '%' || $1::text || '%'
    `,
    [qLower],
  )
  return new Set(res.rows.map((r) => r.handle).filter(Boolean))
}

export function isStorefrontPgSearchEnabled(): boolean {
  const v = String(process.env.STOREFRONT_PG_SEARCH || "").trim().toLowerCase()
  return v === "1" || v === "true" || v === "yes"
}
