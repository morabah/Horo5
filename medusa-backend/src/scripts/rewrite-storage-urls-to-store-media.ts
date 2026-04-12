import { loadEnv } from "@medusajs/framework/utils"
import type { ExecArgs } from "@medusajs/framework/types"
import pg from "pg"

/**
 * Rewrites product image and thumbnail URLs from a direct bucket host (e.g. *.t3.storageapi.dev)
 * to MEDUSA_BACKEND_URL + /store-media so the store-media proxy can serve private objects.
 *
 * Set MEDUSA_BACKEND_URL (no trailing slash). Optional: S3_URL_REWRITE_HOST_SUBSTRING=storageapi.dev
 *
 * Run: npx medusa exec ./src/scripts/rewrite-storage-urls-to-store-media.ts
 */
export default async function rewriteStorageUrlsToStoreMedia(_args: ExecArgs) {
  loadEnv(process.env.NODE_ENV || "development", process.cwd())

  const backend = (process.env.MEDUSA_BACKEND_URL || "").replace(/\/+$/, "")
  const hostMatch = process.env.S3_URL_REWRITE_HOST_SUBSTRING || "storageapi.dev"
  if (!backend) {
    throw new Error("MEDUSA_BACKEND_URL is required")
  }

  const base = `${backend}/store-media`
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error("DATABASE_URL is required")
  }

  const client = new pg.Client({ connectionString: url })
  await client.connect()

  try {
    const imageResult = await client.query(
      `UPDATE image
       SET url = $1 || regexp_replace(url, '^https?://[^/]+', '')
       WHERE url LIKE $2 AND deleted_at IS NULL`,
      [base, `%${hostMatch}%`]
    )
    const thumbResult = await client.query(
      `UPDATE product
       SET thumbnail = $1 || regexp_replace(thumbnail, '^https?://[^/]+', '')
       WHERE thumbnail LIKE $2 AND deleted_at IS NULL`,
      [base, `%${hostMatch}%`]
    )
    // eslint-disable-next-line no-console
    console.log(
      `Updated image rows: ${imageResult.rowCount ?? 0}, product.thumbnail rows: ${thumbResult.rowCount ?? 0}. Public base: ${base}`
    )
  } finally {
    await client.end()
  }
}
