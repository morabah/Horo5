import { loadEnv } from "@medusajs/framework/utils"
import type { ExecArgs } from "@medusajs/framework/types"
import pg from "pg"

export type RewriteStorageUrlsOptions = {
  dryRun?: boolean
  backendUrl?: string
  hostMatch?: string
}

export type RewriteStorageUrlsResult = {
  summary: string
  details: {
    dryRun: boolean
    base: string
    hostMatch: string
    imageRows: number
    thumbnailRows: number
  }
}

/**
 * Rewrites product image and thumbnail URLs from a direct bucket host (e.g. *.t3.storageapi.dev)
 * to MEDUSA_BACKEND_URL + /store-media so the store-media proxy can serve private objects.
 *
 * Set MEDUSA_BACKEND_URL (no trailing slash). Optional: S3_URL_REWRITE_HOST_SUBSTRING=storageapi.dev
 *
 * Run: npx medusa exec ./src/scripts/rewrite-storage-urls-to-store-media.ts
 */
export async function runRewriteStorageUrls(
  options: RewriteStorageUrlsOptions = {},
): Promise<RewriteStorageUrlsResult> {
  loadEnv(process.env.NODE_ENV || "development", process.cwd())

  const dryRun = Boolean(options.dryRun)
  const backend = (options.backendUrl || process.env.MEDUSA_BACKEND_URL || "").replace(/\/+$/, "")
  const hostMatch = options.hostMatch || process.env.S3_URL_REWRITE_HOST_SUBSTRING || "storageapi.dev"
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
    const params = [`%${hostMatch}%`]
    if (dryRun) {
      const imageCount = await client.query<{ c: string }>(
        `SELECT COUNT(*)::text AS c FROM image WHERE url LIKE $1 AND deleted_at IS NULL`,
        params,
      )
      const thumbCount = await client.query<{ c: string }>(
        `SELECT COUNT(*)::text AS c FROM product WHERE thumbnail LIKE $1 AND deleted_at IS NULL`,
        params,
      )
      const details = {
        dryRun,
        base,
        hostMatch,
        imageRows: Number(imageCount.rows[0]?.c ?? 0),
        thumbnailRows: Number(thumbCount.rows[0]?.c ?? 0),
      }
      return {
        summary: `Dry run: would rewrite ${details.imageRows} image row(s) and ${details.thumbnailRows} product thumbnail row(s).`,
        details,
      }
    }

    const imageResult = await client.query(
      `UPDATE image
       SET url = $1 || regexp_replace(url, '^https?://[^/]+', '')
       WHERE url LIKE $2 AND deleted_at IS NULL`,
      [base, `%${hostMatch}%`],
    )
    const thumbResult = await client.query(
      `UPDATE product
       SET thumbnail = $1 || regexp_replace(thumbnail, '^https?://[^/]+', '')
       WHERE thumbnail LIKE $2 AND deleted_at IS NULL`,
      [base, `%${hostMatch}%`],
    )
    const details = {
      dryRun,
      base,
      hostMatch,
      imageRows: imageResult.rowCount ?? 0,
      thumbnailRows: thumbResult.rowCount ?? 0,
    }
    return {
      summary: `Updated ${details.imageRows} image row(s) and ${details.thumbnailRows} product thumbnail row(s).`,
      details,
    }
  } finally {
    await client.end()
  }
}

export default async function rewriteStorageUrlsToStoreMedia(_args: ExecArgs) {
  const result = await runRewriteStorageUrls()
  // eslint-disable-next-line no-console
  console.log(`${result.summary} Public base: ${result.details.base}`)
}
