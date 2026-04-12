import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  batchLinkProductsToCategoryWorkflow,
  createProductCategoriesWorkflow,
  updateProductCategoriesWorkflow,
} from "@medusajs/medusa/core-flows"

import { FEELINGS_ROOT_HANDLE } from "../lib/storefront/feeling-category-metadata"
import { FEELING_TAXONOMY, SUBFEELING_TAXONOMY } from "./data/feelings-taxonomy-data"

type CategoryRow = { handle: string; id: string }

/** Egypt catalog hero SKUs may exist without `primaryFeelingSlug` metadata; map to a valid branch leaf. */
const HERO_PRODUCT_FEELING_FALLBACK: Record<string, { feeling: string; sub: string }> = {
  "horo-emotions-vibe": { feeling: "mood", sub: "i-care" },
  "horo-zodiac-vibe": { feeling: "zodiac", sub: "fire-sign" },
  "horo-fiction-vibe": { feeling: "fiction", sub: "sci-fi" },
  "horo-career-vibe": { feeling: "career", sub: "ambition" },
  "horo-signature-hero": { feeling: "mood", sub: "i-care" },
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {}
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined
}

/**
 * One-time backfill: native `feelings` category tree + product links from product metadata.
 * Category copy uses [`feelings-taxonomy-data`](./data/feelings-taxonomy-data.ts) (same as seed). Legacy custom
 * `feeling` / `subfeeling` modules were removed; run this against DBs that still have `primaryFeelingSlug` /
 * `primarySubfeelingSlug` on products.
 * Idempotent: safe to re-run; updates categories in place by handle.
 */
export default async function migrateFeelingsToProductCategories({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const report = {
    invalid: [] as string[],
    missing: [] as string[],
    linked: 0,
  }

  const { data: rootRows } = await query.graph({
    entity: "product_category",
    fields: ["id", "handle"],
    filters: { handle: FEELINGS_ROOT_HANDLE },
  })
  let root = (rootRows as CategoryRow[] | undefined)?.[0]

  if (!root) {
    const { result } = await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: [
          {
            name: "Feelings",
            handle: FEELINGS_ROOT_HANDLE,
            is_active: true,
            rank: 0,
            description: "Shop by feeling — HORO taxonomy root.",
          },
        ],
      },
    })
    root = (result as CategoryRow[])[0]
    logger.info(`Created root category "${FEELINGS_ROOT_HANDLE}".`)
  }

  if (!root) {
    throw new Error(`Could not create or resolve "${FEELINGS_ROOT_HANDLE}" category.`)
  }

  const idByHandle = new Map<string, string>([[root.handle, root.id]])

  for (const seed of FEELING_TAXONOMY) {
    const name = seed.name
    const blurb = seed.blurb
    const rank = seed.sort_order
    const isActive = true

    const metadata = {
      accent: seed.accent,
      tagline: seed.tagline,
      manifesto: seed.manifesto,
      card_image_src: seed.cardImageSrc,
      card_image_alt: seed.cardImageAlt,
      hero_image_src: seed.heroImageSrc,
      hero_image_alt: seed.heroImageAlt,
      seo_title: `${name} | HORO Egypt`,
      seo_description: `Shop ${name} graphic tees — HORO Egypt.`,
    }

    const { data: existing } = await query.graph({
      entity: "product_category",
      fields: ["id"],
      filters: { handle: seed.slug },
    })
    const row = (existing as Array<{ id: string }> | undefined)?.[0]

    if (row) {
      idByHandle.set(seed.slug, row.id)
      await updateProductCategoriesWorkflow(container).run({
        input: {
          selector: { id: row.id },
          update: {
            name,
            description: blurb,
            is_active: isActive,
            rank,
            metadata,
            parent_category_id: root.id,
          },
        },
      })
    } else {
      const { result } = await createProductCategoriesWorkflow(container).run({
        input: {
          product_categories: [
            {
              name,
              handle: seed.slug,
              description: blurb,
              is_active: isActive,
              rank,
              parent_category_id: root.id,
              metadata,
            },
          ],
        },
      })
      const created = (result as CategoryRow[])[0]
      idByHandle.set(created.handle, created.id)
    }
  }

  for (const seed of SUBFEELING_TAXONOMY) {
    const parentId = idByHandle.get(seed.feeling_slug)
    if (!parentId) {
      report.invalid.push(`missing-parent:${seed.slug}->${seed.feeling_slug}`)
      continue
    }

    const name = seed.name
    const blurb = seed.blurb
    const rank = seed.sort_order
    const isActive = true

    const metadata = {
      card_image_src: seed.cardImageSrc,
      card_image_alt: seed.cardImageAlt,
      hero_image_src: seed.heroImageSrc,
      hero_image_alt: seed.heroImageAlt,
      seo_title: `${name} | HORO Egypt`,
      seo_description: `Shop ${name} graphic tees — HORO Egypt.`,
    }

    const { data: existing } = await query.graph({
      entity: "product_category",
      fields: ["id"],
      filters: { handle: seed.slug },
    })
    const row = (existing as Array<{ id: string }> | undefined)?.[0]

    if (row) {
      idByHandle.set(seed.slug, row.id)
      await updateProductCategoriesWorkflow(container).run({
        input: {
          selector: { id: row.id },
          update: {
            name,
            description: blurb,
            is_active: isActive,
            rank,
            metadata,
            parent_category_id: parentId,
          },
        },
      })
    } else {
      const { result } = await createProductCategoriesWorkflow(container).run({
        input: {
          product_categories: [
            {
              name,
              handle: seed.slug,
              description: blurb,
              is_active: isActive,
              rank,
              parent_category_id: parentId,
              metadata,
            },
          ],
        },
      })
      const created = (result as CategoryRow[])[0]
      idByHandle.set(created.handle, created.id)
    }
  }

  const { data: allCategories } = await query.graph({
    entity: "product_category",
    fields: ["id", "handle", "parent_category_id"],
  })

  const feelingsRootId = idByHandle.get(FEELINGS_ROOT_HANDLE)
  if (!feelingsRootId) {
    throw new Error("Feelings root id missing after migration.")
  }

  const childrenByParent = new Map<string | null, string[]>()
  for (const row of (allCategories || []) as Array<{ id: string; parent_category_id?: string | null }>) {
    const parent = row.parent_category_id ?? null
    const list = childrenByParent.get(parent) || []
    list.push(row.id)
    childrenByParent.set(parent, list)
  }

  const feelingSubtreeIds = new Set<string>()
  const stack = [feelingsRootId]
  while (stack.length) {
    const id = stack.pop()!
    feelingSubtreeIds.add(id)
    const next = childrenByParent.get(id) || []
    stack.push(...next)
  }

  const { data: productRows } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "metadata"],
    pagination: { take: 2000 },
  })

  for (const row of (productRows || []) as Array<{ id: string; handle: string; metadata?: unknown }>) {
    const metadata = asRecord(row.metadata)
    let primaryFeeling = asString(metadata.primaryFeelingSlug) || asString(metadata.feelingSlug)
    let primarySub = asString(metadata.primarySubfeelingSlug) || asString(metadata.lineSlug)

    const heroFallback = HERO_PRODUCT_FEELING_FALLBACK[row.handle]
    if (!primaryFeeling && heroFallback) {
      primaryFeeling = heroFallback.feeling
      primarySub = heroFallback.sub
    }

    if (!primaryFeeling) {
      report.missing.push(row.handle)
      continue
    }

    const feelingHasSubs = SUBFEELING_TAXONOMY.some((entry) => entry.feeling_slug === primaryFeeling)

    let targetHandle: string | undefined
    if (feelingHasSubs) {
      if (!primarySub) {
        report.invalid.push(`${row.handle}:missing_subfeeling_for_parent:${primaryFeeling}`)
        continue
      }
      const match = SUBFEELING_TAXONOMY.find(
        (entry) => entry.feeling_slug === primaryFeeling && entry.slug === primarySub
      )
      if (!match) {
        report.invalid.push(`${row.handle}:unknown_subfeeling:${primarySub}`)
        continue
      }
      targetHandle = primarySub
    } else {
      targetHandle = primaryFeeling
    }

    const targetCategoryId = idByHandle.get(targetHandle || "")
    if (!targetCategoryId) {
      report.invalid.push(`${row.handle}:no_category:${targetHandle}`)
      continue
    }

    const { data: linked } = await query.graph({
      entity: "product",
      fields: ["categories.id"],
      filters: { id: row.id },
    })

    const catIds =
      ((linked || [])[0] as { categories?: Array<{ id: string }> } | undefined)?.categories?.map((c) => c.id) || []

    for (const cid of catIds) {
      if (feelingSubtreeIds.has(cid) && cid !== targetCategoryId) {
        await batchLinkProductsToCategoryWorkflow(container).run({
          input: {
            id: cid,
            add: [],
            remove: [row.id],
          },
        })
      }
    }

    if (!catIds.includes(targetCategoryId)) {
      await batchLinkProductsToCategoryWorkflow(container).run({
        input: {
          id: targetCategoryId,
          add: [row.id],
          remove: [],
        },
      })
    }

    report.linked += 1
  }

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        message: "migrate-feelings-to-product-categories complete",
        linkedProducts: report.linked,
        missingPrimaryFeeling: report.missing,
        invalid: report.invalid,
      },
      null,
      2
    )
  )
}
