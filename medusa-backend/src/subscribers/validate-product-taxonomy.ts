import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

import { fetchChildCategoriesOfParent } from "../lib/storefront/catalog"
import { FEELINGS_ROOT_HANDLE } from "../lib/storefront/feeling-category-metadata"
import type { CategoryNode } from "../lib/storefront/feeling-category-tree"
import {
  categoryAncestorHandlesFromLeaf,
  collectFeelingSubtreeAssignments,
  feelingBranchSegments,
  validateProductFeelingCategoryAssignments,
} from "../lib/storefront/feeling-category-tree"
import { OCCASION_MODULE } from "../modules/occasion"
import type OccasionModuleService from "../modules/occasion/service"

type ProductPayload = { id: string }

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

function enforceTaxonomy(): boolean {
  return String(process.env.HORO_TAXONOMY_ENFORCE || "").trim().toLowerCase() === "true"
}

export default async function validateProductTaxonomySubscriber({
  container,
  event,
}: SubscriberArgs<ProductPayload>) {
  const logger = container.resolve("logger")
  const productId = event.data?.id
  const hardEnforce = enforceTaxonomy()

  if (!productId) {
    return
  }

  const hardErrors: string[] = []

  try {
    const productModule = container.resolve(Modules.PRODUCT) as {
      retrieveProduct: (id: string, config?: Record<string, unknown>) => Promise<{
        metadata?: Record<string, unknown> | null
      }>
    }

    const product = await productModule.retrieveProduct(productId, {})
    const metadata = asRecord(product?.metadata)
    const occasionSlugs = asStringArray(metadata.occasionSlugs)
    const primaryOccasionSlug = asString(metadata.primaryOccasionSlug)
    const decorationType = asString(metadata.decorationType)
    const artworkSlug = asString(metadata.artworkSlug)

    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "categories.id",
        "categories.handle",
        "categories.parent_category.id",
        "categories.parent_category.handle",
        "categories.parent_category.parent_category.id",
        "categories.parent_category.parent_category.handle",
      ],
      filters: { id: productId },
      pagination: {
        take: 1,
      },
    })

    const row = (data || [])[0] as { categories?: CategoryNode[] | null } | undefined
    const categories = row?.categories || []

    const feelingCheck = validateProductFeelingCategoryAssignments(categories, FEELINGS_ROOT_HANDLE)
    if (feelingCheck.errors.includes("missing_feeling_branch")) {
      const msg = `[taxonomy] Product ${productId} has no product_category assignment under "${FEELINGS_ROOT_HANDLE}".`
      logger.warn(msg)
      if (hardEnforce) {
        hardErrors.push(msg)
      }
    }

    if (feelingCheck.errors.includes("multiple_feeling_branches")) {
      const msg = `[taxonomy] Product ${productId} has multiple feeling-branch category assignments.`
      logger.warn(msg)
      if (hardEnforce) {
        hardErrors.push(msg)
      }
    }

    if (feelingCheck.feelingBranchCount === 1) {
      const assignments = collectFeelingSubtreeAssignments(categories, FEELINGS_ROOT_HANDLE)
      const branch = assignments[0]
      const chain = categoryAncestorHandlesFromLeaf(branch)
      const segments = feelingBranchSegments(chain, FEELINGS_ROOT_HANDLE)

      if (branch?.id && segments.length === 1) {
        const activeChildren = (await fetchChildCategoriesOfParent(container, branch.id)).filter(
          (child) => child.is_active !== false
        )

        if (activeChildren.length > 0) {
          const msg = `[taxonomy] Product ${productId} is assigned to parent feeling "${segments[0]}" but subcategories exist — assign a leaf subcategory instead.`
          logger.warn(msg)
          if (hardEnforce) {
            hardErrors.push(msg)
          }
        }
      }
    }

    if (primaryOccasionSlug && !occasionSlugs.includes(primaryOccasionSlug)) {
      logger.warn(
        `[taxonomy] Product ${productId} has primaryOccasionSlug "${primaryOccasionSlug}" not included in occasionSlugs.`
      )
    }

    if (decorationType === "graphic" && !artworkSlug) {
      logger.warn(`[taxonomy] Product ${productId} has decorationType graphic but no artworkSlug.`)
    }

    if (decorationType === "plain" && artworkSlug) {
      logger.warn(`[taxonomy] Product ${productId} has decorationType plain but artworkSlug is set.`)
    }

    const occasionService = container.resolve<OccasionModuleService>(OCCASION_MODULE)

    for (const slug of occasionSlugs) {
      const occasions = await occasionService.listOccasions({ slug })
      const occ = (occasions as Array<{ slug?: string; active?: boolean }>)[0]

      if (!occ) {
        const msg = `[taxonomy] Product ${productId} references unknown occasion slug "${slug}".`
        logger.warn(msg)
        if (hardEnforce) {
          hardErrors.push(msg)
        }
      } else if (occ.active === false) {
        logger.warn(`[taxonomy] Product ${productId} references inactive occasion "${slug}".`)
      }
    }

    if (hardEnforce && hardErrors.length > 0) {
      throw new Error(hardErrors.join(" "))
    }
  } catch (error) {
    if (hardEnforce && hardErrors.length > 0) {
      throw error instanceof Error ? error : new Error(String(error))
    }

    logger.warn(
      `[taxonomy] Validation error for product ${productId}: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

export const config: SubscriberConfig = {
  event: ["product.created", "product.updated"],
}
