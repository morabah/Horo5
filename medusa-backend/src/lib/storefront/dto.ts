import { z } from "zod"

/** Shared FE↔BE validation for storefront JSON (Medusa routes + Next `storefrontRequest`). */

export const storefrontMediaSchema = z
  .object({
    gallery: z.array(z.string()).optional(),
    main: z.string().nullable().optional(),
    blurDataUrlMain: z.string().nullable().optional(),
    dominantColorMain: z.string().nullable().optional(),
  })
  .passthrough()
  .optional()

export const storefrontVariantSchema = z.object({
  allow_backorder: z.boolean(),
  available: z.boolean(),
  currency_code: z.string(),
  id: z.string(),
  inventory_quantity: z.number().nullable(),
  is_discounted: z.boolean(),
  manage_inventory: z.boolean(),
  original_price_egp: z.number().nullable(),
  price_egp: z.number(),
  size: z.string(),
  sku: z.string().nullable().optional(),
  color: z.string().optional(),
  media: storefrontMediaSchema,
})

export const storefrontProductSchema = z
  .object({
    slug: z.string(),
    name: z.string(),
    apparelCategoryPath: z.string().optional(),
    artistDisplay: z.unknown().optional(),
    artistSlug: z.string(),
    artworkSlug: z.string().optional(),
    availableSizes: z.array(z.string()).optional(),
    capsuleSlugs: z.array(z.string()).optional(),
    complementarySlugs: z.array(z.string()).optional(),
    customersAlsoBoughtSlugs: z.array(z.string()).optional(),
    decorationType: z.enum(["plain", "graphic", "embroidered", "mixed"]).optional(),
    description: z.string().optional(),
    feelingSlug: z.string(),
    lineSlug: z.string().optional(),
    fitLabel: z.string().optional(),
    frequentlyBoughtWithSlugs: z.array(z.string()).optional(),
    garmentColors: z.array(z.string()).optional(),
    inventoryHintBySize: z.record(z.string(), z.string()).optional(),
    stockStatusBySize: z
      .record(z.string(), z.enum(["in_stock", "low_stock", "sold_out", "preorder"]))
      .optional(),
    fitBySize: z.record(z.string(), z.record(z.string(), z.number().optional())).optional(),
    launchAt: z.string().optional(),
    sunsetAt: z.string().optional(),
    media: storefrontMediaSchema,
    merchandisingBadge: z.string().optional(),
    occasionSlugs: z.array(z.string()),
    originalPriceEgp: z.number().nullable().optional(),
    pdpTagLabels: z.array(z.string()).optional(),
    pdpFitModels: z.array(z.record(z.string(), z.unknown())).optional(),
    physicalAttributes: z.record(z.string(), z.unknown()).optional(),
    defaultPriceSize: z.string().optional(),
    feelingBrowseEligible: z.boolean().optional(),
    feelingBrowseAssignments: z
      .array(
        z.object({
          feelingSlug: z.string(),
          subfeelingSlug: z.string(),
        })
      )
      .optional(),
    primaryFeelingSlug: z.string(),
    primaryOccasionSlug: z.string().optional(),
    primarySubfeelingSlug: z.string(),
    priceEgp: z.number(),
    sizeTableKey: z.string().optional(),
    stockNote: z.string().optional(),
    story: z.string(),
    thumbnail: z.string().nullable().optional(),
    trustBadges: z.array(z.string()).optional(),
    useCase: z.string().optional(),
    variantsBySize: z.record(z.string(), storefrontVariantSchema),
    wearerStories: z.array(z.record(z.string(), z.unknown())).optional(),
  })
  .passthrough()

export const storefrontSettingsSchema = z.object({
  delivery: z.record(z.string(), z.unknown()).nullable(),
  sizeTables: z.record(z.string(), z.unknown()).nullable(),
  defaultSizeTableKey: z.string().nullable(),
})

export const storefrontPdpResponseSchema = z.object({
  product: storefrontProductSchema,
  settings: storefrontSettingsSchema,
  crossSellProducts: z.array(storefrontProductSchema),
})

export type StorefrontPdpResponse = z.infer<typeof storefrontPdpResponseSchema>
