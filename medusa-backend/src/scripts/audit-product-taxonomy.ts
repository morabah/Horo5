import type { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

import { FEELING_MODULE } from "../modules/feeling"
import type FeelingModuleService from "../modules/feeling/service"
import { OCCASION_MODULE } from "../modules/occasion"
import type OccasionModuleService from "../modules/occasion/service"
import { SUBFEELING_MODULE } from "../modules/subfeeling"
import type SubfeelingModuleService from "../modules/subfeeling/service"
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
 * Lists products (up to 500) and prints TSV: handle, primaryFeelingSlug, feeling_ok, primarySubfeelingSlug, sub_ok, occasionSlugs, invalid_occasions
 * Run: npx medusa exec ./src/scripts/audit-product-taxonomy.ts
 */
export default async function auditProductTaxonomy({ container }: ExecArgs) {
  const feelingService = container.resolve<FeelingModuleService>(FEELING_MODULE)
  const subfeelingService = container.resolve<SubfeelingModuleService>(SUBFEELING_MODULE)
  const occasionService = container.resolve<OccasionModuleService>(OCCASION_MODULE)

  const rows = await listProductsForTaxonomyLinkScan(container, 500)

  const header =
    "handle\tprimaryFeelingSlug\tfeeling_ok\tprimarySubfeelingSlug\tsub_ok\toccasionSlugs\tinvalid_occasions"
  // eslint-disable-next-line no-console
  console.log(header)

  for (const row of rows) {
    const metadata = asRecord(row.metadata)
    const primaryFeelingSlug = asString(metadata.primaryFeelingSlug) || asString(metadata.feelingSlug)
    const primarySubfeelingSlug =
      asString(metadata.primarySubfeelingSlug) || asString(metadata.lineSlug)
    const occasionSlugs = asStringArray(metadata.occasionSlugs)
    const invalidOccasions: string[] = []

    let feelingOk = "yes"
    if (!primaryFeelingSlug) {
      feelingOk = "missing"
    } else {
      const feelings = await feelingService.listFeelings({ slug: primaryFeelingSlug })
      const feeling = (feelings as Array<{ slug?: string }>)[0]
      if (!feeling) {
        feelingOk = "no"
      }
    }

    let subOk = "yes"
    if (!primarySubfeelingSlug) {
      subOk = "missing"
    } else {
      const subfeelings = await subfeelingService.listSubfeelings({ slug: primarySubfeelingSlug })
      const sub = (subfeelings as Array<{ feeling_slug?: string }>)[0]
      if (!sub) {
        subOk = "no"
      } else if (primaryFeelingSlug && sub.feeling_slug && sub.feeling_slug !== primaryFeelingSlug) {
        subOk = "mismatch"
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
      `${handle}\t${primaryFeelingSlug ?? ""}\t${feelingOk}\t${primarySubfeelingSlug ?? ""}\t${subOk}\t${occJoined}\t${invalidJoined}`
    )
  }
}
