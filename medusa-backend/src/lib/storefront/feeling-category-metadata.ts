/**
 * Contract for `product_category.metadata` on nodes under the `feelings` root.
 * Core presentation uses native category fields; these keys hold optional editorial/SEO/media.
 */
export const FEELINGS_ROOT_HANDLE = "feelings" as const

/**
 * Legacy duplicate “Shop by feeling” root from older seeds. Canonical tree uses {@link FEELINGS_ROOT_HANDLE}.
 * Remove from DB with `npm run remove:legacy-taxonomy-feelings` once nothing links here.
 */
export const LEGACY_TAXONOMY_FEELINGS_HANDLE = "taxonomy-feelings" as const

export const FEELING_CATEGORY_METADATA_KEYS = [
  "accent",
  "tagline",
  "manifesto",
  "card_image_src",
  "card_image_alt",
  "hero_image_src",
  "hero_image_alt",
  "seo_title",
  "seo_description",
] as const

export type FeelingCategoryMetadataKey = (typeof FEELING_CATEGORY_METADATA_KEYS)[number]
