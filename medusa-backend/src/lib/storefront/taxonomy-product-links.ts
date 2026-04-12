import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/types"

import { FEELINGS_ROOT_HANDLE } from "./feeling-category-metadata"
import type { CategoryNode } from "./feeling-category-tree"
import { categoryAncestorHandlesFromLeaf } from "./feeling-category-tree"

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

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {}
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
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
  const primary = asString(metadata.primaryFeelingSlug)
  const legacy = asString(metadata.feelingSlug)
  return primary === slug || legacy === slug
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

  return asStringArray(metadata.occasionSlugs).includes(slug)
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
