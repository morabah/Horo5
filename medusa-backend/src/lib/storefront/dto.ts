import { z } from "zod"

/** Shared FE↔BE validation for storefront JSON (Medusa routes + Next `storefrontRequest`). */

export const storefrontMediaSchema = z
  .looseObject({
    card: z.string().nullable().optional(),
    gallery: z
      .array(
        z.looseObject({
          url: z.string(),
          tag: z
            .enum([
              "proof_fabric",
              "proof_print",
              "proof_wash",
              "lifestyle",
              "flat_lay",
              "artwork_detail",
              "back",
            ])
            .optional(),
        })
      )
      .optional(),
    main: z.string().nullable().optional(),
    blurDataUrlMain: z.string().nullable().optional(),
    dominantColorMain: z.string().nullable().optional(),
  })
  .optional()

const storefrontLocalizedTextSchema = z.union([
  z.string(),
  z.looseObject({
      en: z.string().optional(),
      ar: z.string().optional(),
    }),
])

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

export const storefrontProductSchema = z.looseObject({
    id: z.string().optional(),
    slug: z.string(),
    name: z.string(),
    apparelCategoryPath: z.string().optional(),
    artistDisplay: z.unknown().optional(),
    artistSlug: z.string(),
    artworkSlug: z.string().optional(),
    availableSizes: z.array(z.string()).optional(),
    buyerRoute: z.enum(["feeling", "moment", "gift", "personality", "artist_drop", "world"]).optional(),
    primaryAudience: z.enum(["25-40", "18-24", "gift-buyer", "artist-aware", "40-plus"]).optional(),
    firstWedgeEligible: z.boolean().optional(),
    giftable: z.boolean().optional(),
    giftOccasionTags: z.array(z.string()).optional(),
    giftTrustCopy: z.string().optional(),
    careInstructions: z.string().optional(),
    capsuleSlugs: z.array(z.string()).optional(),
    complementarySlugs: z.array(z.string()).optional(),
    customersAlsoBoughtSlugs: z.array(z.string()).optional(),
    decorationType: z.enum(["plain", "graphic", "embroidered", "mixed"]).optional(),
    description: z.string().optional(),
    feelingSlug: z.string(),
    feelsLike: z.array(z.string()).optional(),
    lineSlug: z.string().optional(),
    launchGroup: z.enum(['zodiac_capsule', 'mood', 'lifestyle']).optional(),
    launchAudience: z.enum(['men', 'women', 'unisex']).optional(),
    launchDesign: z.enum([
      'gemini',
      'cancer',
      'leo',
      'virgo',
      'i-care',
      'i-dont-care',
      'walk-alone',
    ]).optional(),
    zodiacSign: z.enum(['gemini', 'cancer', 'leo', 'virgo']).optional(),
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
    promoLabel: storefrontLocalizedTextSchema.optional(),
    promoStartsAt: z.string().optional(),
    promoEndsAt: z.string().optional(),
    promoShowCountdown: z.boolean().optional(),
    priceEgp: z.number(),
    sizeTableKey: z.string().optional(),
    stockNote: z.string().optional(),
    story: z.string(),
    storyDescription: z.string().optional(),
    thumbnail: z.string().nullable().optional(),
    trustBadges: z.array(z.string()).optional(),
    reviewsSummary: z.looseObject({
      count: z.number(),
      averageRating: z.number(),
    }).optional(),
    reviewProof: z.array(z.looseObject({
      id: z.string(),
      rating: z.number(),
      body: z.string(),
      locale: z.string(),
      photoUrl: z.string().nullable().optional(),
      videoUrl: z.string().nullable().optional(),
      instagramHandle: z.string().nullable().optional(),
      permissionToRepost: z.boolean(),
      fitFeedback: z.string().nullable().optional(),
      giftFeedback: z.string().nullable().optional(),
      ugcType: z.enum(["review", "photo", "video", "delivery_reaction"]),
      source: z.enum(["post_delivery_whatsapp", "website", "manual_admin", "instagram"]),
      createdAt: z.string().nullable().optional(),
    })).optional(),
    worksFor: z.array(z.string()).optional(),
    useCase: z.string().optional(),
    variantsBySize: z.record(z.string(), storefrontVariantSchema),
    wearerStories: z.array(z.record(z.string(), z.unknown())).optional(),
    artistStorySlides: z.array(z.record(z.string(), z.unknown())).optional(),
  })

const storefrontNavItemSchema = z.looseObject({
    key: z.string(),
    label: storefrontLocalizedTextSchema,
    href: z.string(),
    badge: storefrontLocalizedTextSchema.optional(),
    active: z.boolean(),
    sortOrder: z.number(),
  })

const storefrontGovernorateSchema = z.looseObject({
    code: z.string(),
    name: storefrontLocalizedTextSchema,
    codEligible: z.boolean(),
    expressEligible: z.boolean(),
  })

const storefrontPriceBandSchema = z.looseObject({
    key: z.string(),
    minEgp: z.number().nullable(),
    maxEgp: z.number().nullable(),
    label: storefrontLocalizedTextSchema,
  })

export const storefrontHomepageSectionSchema = z.looseObject({
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
      "editorial_feature",
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
