import type { Pool } from "pg"
import { Pool as PgPool } from "pg"

let pool: Pool | null | undefined

/**
 * Shared pool for optional raw SQL (storefront search). Uses `DATABASE_URL` from the environment.
 */
export function getStorefrontPgPool(): Pool | null {
  if (pool !== undefined) {
    return pool
  }
  const url = process.env.DATABASE_URL?.trim()
  if (!url) {
    pool = null
    return pool
  }
  const ssl =
    process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "false"
      ? { rejectUnauthorized: false as const }
      : undefined
  pool = new PgPool({
    connectionString: url,
    max: 5,
    ...(ssl ? { ssl } : {}),
  })
  return pool
}
