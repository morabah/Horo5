import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { FEELINGS_ROOT_HANDLE } from "../lib/storefront/feeling-category-metadata"
import type { CategoryNode } from "../lib/storefront/feeling-category-tree"
import {
  categoryAncestorHandlesFromLeaf,
  derivePrimaryFeelingSlugsFromProductCategories,
} from "../lib/storefront/feeling-category-tree"
import { OCCASION_MODULE } from "../modules/occasion"
import type OccasionModuleService from "../modules/occasion/service"
import { listProductsForTaxonomyLinkScan } from "../lib/storefront/taxonomy-product-links"

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

/**
 * Lists products (up to 500) and prints TSV: handle, derived feeling/sub, category_ok, occasionSlugs, invalid_occasions
 * Run: npx medusa exec ./src/scripts/audit-product-taxonomy.ts
 */
export default async function auditProductTaxonomy({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const occasionService = container.resolve<OccasionModuleService>(OCCASION_MODULE)

  const rows = await listProductsForTaxonomyLinkScan(container, 500)

  const header =
    "handle\tderivedFeeling\tderivedSub\tcategory_ok\toccasionSlugs\tinvalid_occasions"
  // eslint-disable-next-line no-console
  console.log(header)

  for (const row of rows) {
    const metadata = asRecord(row.metadata)
    const occasionSlugs = asStringArray(metadata.occasionSlugs)
    const invalidOccasions: string[] = []

    const { data: productRow } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "categories.handle",
        "categories.parent_category.handle",
        "categories.parent_category.parent_category.handle",
      ],
      filters: { id: row.id },
      pagination: { take: 1 },
    })

    const categories = ((productRow || [])[0] as { categories?: CategoryNode[] | null } | undefined)
      ?.categories

    const derived = derivePrimaryFeelingSlugsFromProductCategories(categories, FEELINGS_ROOT_HANDLE)
    const derivedFeeling = derived?.primaryFeelingSlug ?? ""
    const derivedSub = derived?.primarySubfeelingSlug ?? ""

    let categoryOk = "yes"
    if (!categories?.length) {
      categoryOk = "missing_categories"
    } else {
      const chains = (categories || []).map((c) => categoryAncestorHandlesFromLeaf(c))
      const underFeelings = chains.filter((chain) => chain.includes(FEELINGS_ROOT_HANDLE))
      if (underFeelings.length === 0) {
        categoryOk = "no_feelings_branch"
      } else if (underFeelings.length > 1) {
        categoryOk = "multiple_branches"
      }
    }

    for (const slug of occasionSlugs) {
      const occasions = await occasionService.listOccasions({ slug })
      const occ = (occasions as Array<{ slug?: string }>)[0]
      if (!occ) {
        invalidOccasions.push(slug)
      }
    }

    const handle = row.handle || row.id
    const occJoined = occasionSlugs.join("|")
    const invalidJoined = invalidOccasions.join("|")

    // eslint-disable-next-line no-console
    console.log(
      `${handle}\t${derivedFeeling}\t${derivedSub}\t${categoryOk}\t${occJoined}\t${invalidJoined}`
    )
  }
}
