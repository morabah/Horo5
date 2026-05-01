import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/types"

import { FEELINGS_ROOT_HANDLE } from "../storefront/feeling-category-metadata"
import type { CategoryNode } from "../storefront/feeling-category-tree"
import {
  categoryAncestorHandlesFromLeaf,
  derivePrimaryFeelingSlugsFromProductCategories,
  validateProductFeelingCategoryAssignmentsFlat,
} from "../storefront/feeling-category-tree"
import { listProductsForTaxonomyLinkScan } from "../storefront/taxonomy-product-links"
import { asRecord, asStringArrayOrEmpty } from "../shared/type-guards"
import { OCCASION_MODULE } from "../../modules/occasion"
import type OccasionModuleService from "../../modules/occasion/service"

type Query = {
  graph: (query: Record<string, unknown>) => Promise<{ data?: unknown; metadata?: { count?: number } }>
}

type ProductTaxonomyRow = {
  id: string
  handle?: string | null
  metadata?: Record<string, unknown> | null
}

export type TaxonomyAuditIssueType =
  | "missing_categories"
  | "no_feelings_branch"
  | "multiple_feelings_branches"
  | "invalid_occasion"
  | "assignment_error"

export type TaxonomyAuditIssue = {
  productId: string
  handle: string
  type: TaxonomyAuditIssueType
  message: string
  details?: Record<string, unknown>
}

export type TaxonomyAuditProduct = {
  id: string
  handle: string
  derivedFeeling: string | null
  derivedSubfeeling: string | null
  occasionSlugs: string[]
  issueCount: number
}

export type TaxonomyAuditReport = {
  checked: number
  issueCount: number
  issues: TaxonomyAuditIssue[]
  products: TaxonomyAuditProduct[]
  counts: {
    byFeeling: Record<string, number>
    bySubfeeling: Record<string, number>
    byOccasion: Record<string, number>
  }
}

function increment(map: Record<string, number>, key: string | null | undefined) {
  if (!key) return
  map[key] = (map[key] ?? 0) + 1
}

export async function runProductTaxonomyAudit(
  container: MedusaContainer,
  options: { take?: number } = {},
): Promise<TaxonomyAuditReport> {
  const query = container.resolve<Query>(ContainerRegistrationKeys.QUERY)
  const occasionService = container.resolve<OccasionModuleService>(OCCASION_MODULE)
  const take = Math.min(Math.max(Number(options.take || 500), 1), 5000)

  const [rows, occasionsResult, flatCategoriesResult] = await Promise.all([
    listProductsForTaxonomyLinkScan(container, take),
    occasionService.listOccasions({}),
    query.graph({
      entity: "product_category",
      fields: ["id", "handle", "parent_category_id"],
      pagination: { take: 10000 },
    }),
  ])

  const occasionSlugs = new Set(
    ((occasionsResult || []) as Array<{ slug?: string | null }>)
      .map((occasion) => occasion.slug)
      .filter((slug): slug is string => typeof slug === "string" && slug.length > 0),
  )
  const categoryById = new Map(
    ((flatCategoriesResult.data || []) as Array<{ id: string; handle: string; parent_category_id?: string | null }>)
      .map((row) => [row.id, row]),
  )

  const products: TaxonomyAuditProduct[] = []
  const issues: TaxonomyAuditIssue[] = []
  const counts = {
    byFeeling: {} as Record<string, number>,
    bySubfeeling: {} as Record<string, number>,
    byOccasion: {} as Record<string, number>,
  }

  for (const row of rows as ProductTaxonomyRow[]) {
    const handle = row.handle || row.id
    const metadata = asRecord(row.metadata)
    const productIssues: TaxonomyAuditIssue[] = []

    const { data: productRow } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "categories.id",
        "categories.handle",
        "categories.parent_category.handle",
        "categories.parent_category.parent_category.handle",
      ],
      filters: { id: row.id },
      pagination: { take: 1 },
    })

    const productRows = Array.isArray(productRow) ? productRow : []
    const categories = (productRows[0] as { categories?: CategoryNode[] | null } | undefined)?.categories ?? []
    const derived = derivePrimaryFeelingSlugsFromProductCategories(categories, FEELINGS_ROOT_HANDLE)
    const derivedFeeling = derived?.primaryFeelingSlug ?? null
    const derivedSubfeeling = derived?.primarySubfeelingSlug ?? null

    if (!categories.length) {
      productIssues.push({
        productId: row.id,
        handle,
        type: "missing_categories",
        message: "Product has no categories.",
      })
    } else {
      const chains = categories.map((category) => categoryAncestorHandlesFromLeaf(category))
      const underFeelings = chains.filter((chain) => chain.includes(FEELINGS_ROOT_HANDLE))
      if (underFeelings.length === 0) {
        productIssues.push({
          productId: row.id,
          handle,
          type: "no_feelings_branch",
          message: "Product is not assigned under the feelings taxonomy branch.",
        })
      } else if (underFeelings.length > 1) {
        productIssues.push({
          productId: row.id,
          handle,
          type: "multiple_feelings_branches",
          message: "Product is assigned to multiple feeling taxonomy branches.",
          details: { branches: underFeelings },
        })
      }
    }

    const categoryIds = categories.map((category) => category.id).filter(Boolean) as string[]
    const assignmentCheck = validateProductFeelingCategoryAssignmentsFlat(categoryIds, categoryById, FEELINGS_ROOT_HANDLE)
    for (const error of assignmentCheck.errors) {
      productIssues.push({
        productId: row.id,
        handle,
        type: "assignment_error",
        message: error,
      })
    }

    const productOccasionSlugs = asStringArrayOrEmpty(metadata.occasionSlugs)
    for (const slug of productOccasionSlugs) {
      increment(counts.byOccasion, slug)
      if (!occasionSlugs.has(slug)) {
        productIssues.push({
          productId: row.id,
          handle,
          type: "invalid_occasion",
          message: `Product references missing occasion "${slug}".`,
          details: { slug },
        })
      }
    }

    increment(counts.byFeeling, derivedFeeling)
    increment(counts.bySubfeeling, derivedSubfeeling)
    issues.push(...productIssues)
    products.push({
      id: row.id,
      handle,
      derivedFeeling,
      derivedSubfeeling,
      occasionSlugs: productOccasionSlugs,
      issueCount: productIssues.length,
    })
  }

  return {
    checked: products.length,
    issueCount: issues.length,
    issues,
    products,
    counts,
  }
}
