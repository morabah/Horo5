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

/**
 * Writes `metadata.artist` = `{ name, avatarUrl? }` from `storefront_artist` using `metadata.artistSlug`.
 * Skips products with a valid `metadata.artist.name`, hidden add-ons, or no explicit `artistSlug`.
 *
 * Run (from medusa-backend):
 *   npm run backfill:product-artist-metadata
 *   DRY_RUN=1 npm run backfill:product-artist-metadata
 *   PRODUCT_HANDLE=emotions-raw-nerve npm run backfill:product-artist-metadata
 */
export default async function backfillProductArtistMetadata({ container }: ExecArgs) {
  const dryRun = String(process.env.DRY_RUN || "").trim() === "1"
  const handleFilter = (process.env.PRODUCT_HANDLE || "").trim()

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

  for (const row of rows) {
    const meta: Record<string, unknown> = { ...(row.metadata || {}) }

    if (meta.hidden === true || meta.hidden === "true") {
      continue
    }

    const existingArtist = meta.artist

    if (existingArtist && typeof existingArtist === "object" && !Array.isArray(existingArtist)) {
      const name = String((existingArtist as { name?: unknown }).name || "").trim()

      if (name) {
        continue
      }
    }

    const slugExplicit = typeof meta.artistSlug === "string" ? meta.artistSlug.trim() : ""

    if (!slugExplicit) {
      continue
    }

    const resolved = bySlug.get(slugExplicit)

    if (!resolved?.name?.trim()) {
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

    // eslint-disable-next-line no-console
    console.log(JSON.stringify({ handle: row.handle, artist: artistPayload }))
  }
}
