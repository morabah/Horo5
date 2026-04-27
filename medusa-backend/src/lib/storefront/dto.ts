import { z } from "zod"

/** Shared FE↔BE validation for storefront JSON (Medusa routes + Next `storefrontRequest`). */

export const storefrontMediaSchema = z
  .object({
    card: z.string().nullable().optional(),
    gallery: z
      .array(
        z
          .object({
            url: z.string(),
            tag: z
              .enum(["proof_fabric", "proof_print", "proof_wash", "lifestyle", "flat_lay"])
              .optional(),
          })
          .passthrough()
      )
      .optional(),
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
    feelsLike: z.array(z.string()).optional(),
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
    promoEndsAt: z.string().optional(),
    priceEgp: z.number(),
    sizeTableKey: z.string().optional(),
    stockNote: z.string().optional(),
    story: z.string(),
    storyDescription: z.string().optional(),
    thumbnail: z.string().nullable().optional(),
    trustBadges: z.array(z.string()).optional(),
    worksFor: z.array(z.string()).optional(),
    useCase: z.string().optional(),
    variantsBySize: z.record(z.string(), storefrontVariantSchema),
    wearerStories: z.array(z.record(z.string(), z.unknown())).optional(),
  })
  .passthrough()

const storefrontLocalizedTextSchema = z.union([
  z.string(),
  z
    .object({
      en: z.string().optional(),
      ar: z.string().optional(),
    })
    .passthrough(),
])

const storefrontNavItemSchema = z
  .object({
    key: z.string(),
    label: storefrontLocalizedTextSchema,
    href: z.string(),
    badge: storefrontLocalizedTextSchema.optional(),
    active: z.boolean(),
    sortOrder: z.number(),
  })
  .passthrough()

const storefrontGovernorateSchema = z
  .object({
    code: z.string(),
    name: storefrontLocalizedTextSchema,
    codEligible: z.boolean(),
    expressEligible: z.boolean(),
  })
  .passthrough()

const storefrontPriceBandSchema = z
  .object({
    key: z.string(),
    minEgp: z.number().nullable(),
    maxEgp: z.number().nullable(),
    label: storefrontLocalizedTextSchema,
  })
  .passthrough()

export const storefrontHomepageSectionSchema = z
  .object({
    id: z.string(),
    key: z.string(),
    type: z.enum([
      "hero",
      "trust_ribbon",
      "primary_routes",
      "founding_drop",
      "featured_piece",
      "feeling_grid",
      "occasion_grid",
      "gift_block",
      "why_horo",
      "first_drop_circle",
      "proof_strip",
      "seen_on_you",
      "artist_spotlight",
    ]),
    eyebrow: storefrontLocalizedTextSchema.nullable(),
    title: storefrontLocalizedTextSchema.nullable(),
    body: storefrontLocalizedTextSchema.nullable(),
    primaryCta: z
      .object({
        label: storefrontLocalizedTextSchema.nullable(),
        href: z.string().nullable(),
      })
      .nullable(),
    secondaryCta: z
      .object({
        label: storefrontLocalizedTextSchema.nullable(),
        href: z.string().nullable(),
      })
      .nullable(),
    image: z
      .object({
        src: z.string(),
        alt: storefrontLocalizedTextSchema.nullable(),
      })
      .nullable(),
    accent: z.string().nullable(),
    sortOrder: z.number(),
    active: z.boolean(),
    payload: z.record(z.string(), z.unknown()).nullable(),
  })
  .passthrough()

export const storefrontHomepageResponseSchema = z.object({
  sections: z.array(storefrontHomepageSectionSchema),
})

export const storefrontSettingsSchema = z.object({
  delivery: z.record(z.string(), z.unknown()).nullable(),
  sizeTables: z.record(z.string(), z.unknown()).nullable(),
  defaultSizeTableKey: z.string().nullable(),
  navigation: z
    .object({
      primary: z.array(storefrontNavItemSchema),
      drawer: z.array(storefrontNavItemSchema),
    })
    .nullable()
    .optional(),
  checkout: z
    .object({
      governorates: z.array(storefrontGovernorateSchema),
      paymentMethodOrder: z.array(z.string()),
    })
    .nullable()
    .optional(),
  search: z
    .object({
      priceBands: z.array(storefrontPriceBandSchema),
    })
    .nullable()
    .optional(),
  homepage: z
    .object({
      sectionsEnabled: z.array(z.string()).nullable(),
    })
    .nullable()
    .optional(),
  loyalty: z
    .object({
      creditOnSecondOrderEgp: z.number().nullable(),
      expiryDays: z.number().nullable(),
    })
    .nullable()
    .optional(),
})

export const storefrontPdpResponseSchema = z.object({
  product: storefrontProductSchema,
  settings: storefrontSettingsSchema,
  crossSellProducts: z.array(storefrontProductSchema),
})

export type StorefrontPdpResponse = z.infer<typeof storefrontPdpResponseSchema>
export type StorefrontHomepageResponse = z.infer<typeof storefrontHomepageResponseSchema>
