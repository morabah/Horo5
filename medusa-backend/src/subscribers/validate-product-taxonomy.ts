import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

import { FEELING_MODULE } from "../modules/feeling"
import type FeelingModuleService from "../modules/feeling/service"
import { OCCASION_MODULE } from "../modules/occasion"
import type OccasionModuleService from "../modules/occasion/service"
import { SUBFEELING_MODULE } from "../modules/subfeeling"
import type SubfeelingModuleService from "../modules/subfeeling/service"

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
    const primaryFeelingSlug = asString(metadata.primaryFeelingSlug) || asString(metadata.feelingSlug)
    const primarySubfeelingSlug =
      asString(metadata.primarySubfeelingSlug) || asString(metadata.lineSlug)
    const occasionSlugs = asStringArray(metadata.occasionSlugs)
    const primaryOccasionSlug = asString(metadata.primaryOccasionSlug)
    const decorationType = asString(metadata.decorationType)
    const artworkSlug = asString(metadata.artworkSlug)

    if (!primaryFeelingSlug) {
      const msg = `[taxonomy] Product ${productId} is missing primaryFeelingSlug / feelingSlug in metadata.`
      logger.warn(msg)
      if (hardEnforce) {
        hardErrors.push(msg)
      }
    }

    if (!primarySubfeelingSlug) {
      const msg = `[taxonomy] Product ${productId} is missing primarySubfeelingSlug / lineSlug in metadata.`
      logger.warn(msg)
      if (hardEnforce) {
        hardErrors.push(msg)
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

    const feelingService = container.resolve<FeelingModuleService>(FEELING_MODULE)
    const subfeelingService = container.resolve<SubfeelingModuleService>(SUBFEELING_MODULE)
    const occasionService = container.resolve<OccasionModuleService>(OCCASION_MODULE)

    if (primaryFeelingSlug) {
      const feelings = await feelingService.listFeelings({ slug: primaryFeelingSlug })
      const feeling = (feelings as Array<{ slug?: string; active?: boolean }>)[0]

      if (!feeling) {
        const msg = `[taxonomy] Product ${productId} references unknown feeling slug "${primaryFeelingSlug}".`
        logger.warn(msg)
        if (hardEnforce) {
          hardErrors.push(msg)
        }
      } else if (feeling.active === false) {
        logger.warn(`[taxonomy] Product ${productId} references inactive feeling "${primaryFeelingSlug}".`)
      }
    }

    if (primarySubfeelingSlug) {
      const subfeelings = await subfeelingService.listSubfeelings({ slug: primarySubfeelingSlug })
      const sub = (subfeelings as Array<{ slug?: string; feeling_slug?: string; active?: boolean }>)[0]

      if (!sub) {
        const msg = `[taxonomy] Product ${productId} references unknown subfeeling slug "${primarySubfeelingSlug}".`
        logger.warn(msg)
        if (hardEnforce) {
          hardErrors.push(msg)
        }
      } else {
        if (sub.active === false) {
          logger.warn(`[taxonomy] Product ${productId} references inactive subfeeling "${primarySubfeelingSlug}".`)
        }

        if (primaryFeelingSlug && sub.feeling_slug && sub.feeling_slug !== primaryFeelingSlug) {
          const msg = `[taxonomy] Product ${productId} subfeeling "${primarySubfeelingSlug}" does not belong to feeling "${primaryFeelingSlug}".`
          logger.warn(msg)
          if (hardEnforce) {
            hardErrors.push(msg)
          }
        }
      }
    }

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
