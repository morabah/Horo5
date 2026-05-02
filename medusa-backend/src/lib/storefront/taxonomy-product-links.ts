import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/types"

import { FEELINGS_ROOT_HANDLE } from "./feeling-category-metadata"
import type { CategoryNode } from "./feeling-category-tree"
import { categoryAncestorHandlesFromLeaf } from "./feeling-category-tree"
import { asRecord, asString, asStringArrayOrEmpty } from "../shared/type-guards"

const TAXONOMY_LINK_PRODUCT_FIELDS = [
  "id",
  "handle",
  "metadata",
  "categories.handle",
  "categories.parent_category.handle",
  "categories.parent_category.parent_category.handle",
] as const

type ProductTaxonomyRow = {
  categories?: CategoryNode[] | null
  handle?: string | null
  id: string
  metadata?: Record<string, unknown> | null
}

function legacyTaxonomyMetadataFallbackEnabled(): boolean {
  return String(process.env.STOREFRONT_FEELINGS_LEGACY_FALLBACK || "").trim().toLowerCase() !== "false"
}

function feelingSegmentsUnderRoot(category: CategoryNode | null | undefined): string[] {
  const chain = categoryAncestorHandlesFromLeaf(category)
  const idx = chain.indexOf(FEELINGS_ROOT_HANDLE)
  if (idx === -1) {
    return []
  }

  return chain.slice(idx + 1)
}

export async function listProductsForTaxonomyLinkScan(
  scope: MedusaContainer,
  take = 500
): Promise<ProductTaxonomyRow[]> {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data } = await query.graph(
    {
      entity: "product",
      fields: [...TAXONOMY_LINK_PRODUCT_FIELDS],
      pagination: {
        order: {
          created_at: "ASC",
        },
        take,
      },
    },
    {
      cache: {
        enable: false,
      },
    }
  )

  return (data || []) as ProductTaxonomyRow[]
}

export function productReferencesFeelingSlug(row: ProductTaxonomyRow, slug: string): boolean {
  for (const category of row.categories || []) {
    const segments = feelingSegmentsUnderRoot(category)
    if (segments.length >= 1 && segments[0] === slug) {
      return true
    }
  }

  if (!legacyTaxonomyMetadataFallbackEnabled()) {
    return false
  }

  const metadata = asRecord(row.metadata)
  if (asString(metadata.primaryFeelingSlug) === slug || asString(metadata.feelingSlug) === slug) {
    return true
  }

  const feelingSlugs = asStringArrayOrEmpty(metadata.primaryFeelingSlugs ?? metadata.feelingSlugs)
  return feelingSlugs.includes(slug)
}

export function productReferencesSubfeelingSlug(row: ProductTaxonomyRow, slug: string): boolean {
  for (const category of row.categories || []) {
    const segments = feelingSegmentsUnderRoot(category)
    if (segments.length >= 2 && segments[segments.length - 1] === slug) {
      return true
    }
  }

  if (!legacyTaxonomyMetadataFallbackEnabled()) {
    return false
  }

  const metadata = asRecord(row.metadata)
  const primary = asString(metadata.primarySubfeelingSlug)
  const line = asString(metadata.lineSlug)
  return primary === slug || line === slug
}

export function productReferencesOccasionSlug(row: ProductTaxonomyRow, slug: string): boolean {
  const metadata = asRecord(row.metadata)
  if (asString(metadata.primaryOccasionSlug) === slug) {
    return true
  }

  const occasionSlugs = asStringArrayOrEmpty(metadata.primaryOccasionSlugs ?? metadata.occasionSlugs)
  return occasionSlugs.includes(slug)
}

export async function countProductsLinkedToFeelingSlug(scope: MedusaContainer, slug: string): Promise<number> {
  const rows = await listProductsForTaxonomyLinkScan(scope)
  return rows.filter((row) => productReferencesFeelingSlug(row, slug)).length
}

export async function countProductsLinkedToSubfeelingSlug(scope: MedusaContainer, slug: string): Promise<number> {
  const rows = await listProductsForTaxonomyLinkScan(scope)
  return rows.filter((row) => productReferencesSubfeelingSlug(row, slug)).length
}

export async function countProductsLinkedToOccasionSlug(scope: MedusaContainer, slug: string): Promise<number> {
  const rows = await listProductsForTaxonomyLinkScan(scope)
  return rows.filter((row) => productReferencesOccasionSlug(row, slug)).length
}
