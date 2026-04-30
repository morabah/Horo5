import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"

import { ARTIST_MODULE } from "../modules/artist"
import type ArtistModuleService from "../modules/artist/service"

type ProductRow = {
  id: string
  handle: string
  metadata?: Record<string, unknown> | null
}

export type BackfillProductArtistMetadataOptions = {
  dryRun?: boolean
  productHandle?: string
}

export type BackfillProductArtistMetadataResult = {
  summary: string
  details: {
    dryRun: boolean
    productHandle: string | null
    scanned: number
    updated: number
    skippedHidden: number
    skippedExistingArtist: number
    skippedMissingSlug: number
    unresolvedArtistSlug: number
    samples: Array<{ handle: string; artist?: { name: string; avatarUrl?: string }; warning?: string; slug?: string }>
  }
}

/**
 * Writes `metadata.artist` = `{ name, avatarUrl? }` from `storefront_artist` using `metadata.artistSlug`.
 * Skips products with a valid `metadata.artist.name`, hidden add-ons, or no explicit `artistSlug`.
 *
 * Run (from medusa-backend):
 *   npm run backfill:product-artist-metadata
 *   DRY_RUN=1 npm run backfill:product-artist-metadata
 *   PRODUCT_HANDLE=emotions-raw-nerve npm run backfill:product-artist-metadata
 */
export async function runBackfillProductArtistMetadata(
  container: ExecArgs["container"],
  options: BackfillProductArtistMetadataOptions = {},
): Promise<BackfillProductArtistMetadataResult> {
  const dryRun = Boolean(options.dryRun)
  const handleFilter = (options.productHandle || "").trim()
  const artistService = container.resolve<ArtistModuleService>(ARTIST_MODULE)
  const artists = (await artistService.listArtists({})) as Array<{
    slug: string
    name: string
    avatar_src?: string | null
  }>
  const bySlug = new Map(artists.map((artist) => [artist.slug, artist]))

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "metadata"],
    filters: handleFilter ? { handle: handleFilter } : {},
    pagination: {
      take: 2000,
    },
  })

  const rows = (data || []) as ProductRow[]
  const samples: BackfillProductArtistMetadataResult["details"]["samples"] = []
  let updated = 0
  let skippedHidden = 0
  let skippedExistingArtist = 0
  let skippedMissingSlug = 0
  let unresolvedArtistSlug = 0

  for (const row of rows) {
    const meta: Record<string, unknown> = { ...(row.metadata || {}) }

    if (meta.hidden === true || meta.hidden === "true") {
      skippedHidden++
      continue
    }

    const existingArtist = meta.artist

    if (existingArtist && typeof existingArtist === "object" && !Array.isArray(existingArtist)) {
      const name = String((existingArtist as { name?: unknown }).name || "").trim()

      if (name) {
        skippedExistingArtist++
        continue
      }
    }

    const slugExplicit = typeof meta.artistSlug === "string" ? meta.artistSlug.trim() : ""

    if (!slugExplicit) {
      skippedMissingSlug++
      continue
    }

    const resolved = bySlug.get(slugExplicit)

    if (!resolved?.name?.trim()) {
      unresolvedArtistSlug++
      if (samples.length < 10) {
        samples.push({ handle: row.handle, warning: "no_storefront_artist_for_slug", slug: slugExplicit })
      }
      // eslint-disable-next-line no-console
      console.warn(JSON.stringify({ handle: row.handle, warn: "no_storefront_artist_for_slug", slug: slugExplicit }))
      continue
    }

    const avatarUrl = resolved.avatar_src?.trim() || undefined
    const artistPayload = {
      name: resolved.name.trim(),
      ...(avatarUrl ? { avatarUrl } : {}),
    }
    const next = { ...meta, artist: artistPayload }

    if (dryRun) {
      updated++
      if (samples.length < 10) {
        samples.push({ handle: row.handle, artist: artistPayload })
      }
      // eslint-disable-next-line no-console
      console.log(JSON.stringify({ handle: row.handle, dryRun: true, artist: artistPayload }))
      continue
    }

    await updateProductsWorkflow(container).run({
      input: {
        selector: { id: row.id },
        update: { metadata: next },
      },
    })

    updated++
    if (samples.length < 10) {
      samples.push({ handle: row.handle, artist: artistPayload })
    }
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({ handle: row.handle, artist: artistPayload }))
  }

  return {
    summary: `${dryRun ? "Dry run: would update" : "Updated"} ${updated} product artist metadata row(s).`,
    details: {
      dryRun,
      productHandle: handleFilter || null,
      scanned: rows.length,
      updated,
      skippedHidden,
      skippedExistingArtist,
      skippedMissingSlug,
      unresolvedArtistSlug,
      samples,
    },
  }
}

export default async function backfillProductArtistMetadata({ container }: ExecArgs) {
  await runBackfillProductArtistMetadata(container, {
    dryRun: String(process.env.DRY_RUN || "").trim() === "1",
    productHandle: (process.env.PRODUCT_HANDLE || "").trim(),
  })
}
