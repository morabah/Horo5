/**
 * Backfill product metadata.media.card + media.main with front-facing drop images.
 *
 * Usage (from medusa-backend/):
 *   npx medusa exec ./src/scripts/fix-drop-homepage-media.ts
 *   npx medusa exec ./src/scripts/fix-drop-homepage-media.ts --dry-run
 */
import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

import type { DropImageInput } from "../lib/drops/types"
import { pickDropFrontMediaUrls } from "../lib/storefront/media-picks"

type ProductRow = {
  id: string
  handle?: string | null
  metadata?: Record<string, unknown> | null
}

function imagesFromMetadata(metadata: Record<string, unknown> | null | undefined): DropImageInput[] {
  const media = metadata?.media
  if (!media || typeof media !== "object" || Array.isArray(media)) {
    return []
  }

  const raw = media as {
    main?: string
    card?: string
    gallery?: Array<{ url?: string; tag?: string } | string>
  }

  const out: DropImageInput[] = []
  if (raw.main?.trim()) {
    out.push({ tag: "main", url: raw.main.trim(), filename: "main.jpg" })
  }
  if (raw.card?.trim() && raw.card.trim() !== raw.main?.trim()) {
    out.push({ tag: "card", url: raw.card.trim(), filename: "card.jpg" })
  }

  for (const entry of raw.gallery ?? []) {
    if (typeof entry === "string" && entry.trim()) {
      out.push({ tag: "lifestyle", url: entry.trim(), filename: "gallery.jpg" })
      continue
    }
    if (entry && typeof entry === "object" && entry.url?.trim()) {
      const tag = (entry.tag ?? "lifestyle") as DropImageInput["tag"]
      out.push({ tag, url: entry.url.trim(), filename: `${tag}.jpg` })
    }
  }

  return out
}

export default async function fixDropHomepageMedia({ container }: ExecArgs) {
  const dryRun = process.argv.includes("--dry-run")
  const productModule = container.resolve(Modules.PRODUCT)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  const products = (await productModule.listProducts(
    {},
    { select: ["id", "handle", "metadata"], take: 500 },
  )) as ProductRow[]

  let updated = 0

  for (const product of products) {
    const metadata = (product.metadata ?? {}) as Record<string, unknown>
    const images = imagesFromMetadata(metadata)
    if (images.length === 0) continue

    const picked = pickDropFrontMediaUrls(images)
    if (!picked.card && !picked.main) continue

    const media = (metadata.media ?? {}) as Record<string, unknown>
    const nextMedia = {
      ...media,
      ...(picked.main ? { main: picked.main } : {}),
      ...(picked.card ? { card: picked.card } : {}),
    }

    const unchanged =
      media.main === nextMedia.main && media.card === nextMedia.card
    if (unchanged) continue

    updated += 1
    logger.info(
      `${dryRun ? "[dry-run] " : ""}${product.handle ?? product.id}: card=${picked.card ?? "-"} main=${picked.main ?? "-"}`,
    )

    if (!dryRun) {
      await productModule.updateProducts(product.id, {
        metadata: {
          ...metadata,
          media: nextMedia,
        },
      })
    }
  }

  logger.info(`fix-drop-homepage-media: ${updated} product(s) ${dryRun ? "would be " : ""}updated`)
}
