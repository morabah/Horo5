/**
 * HORO product metafield definitions.
 * Aligned with docs/shopify-final-admin-data-model-lock.md §2.
 *
 * Legacy fields intentionally excluded:
 *   feeling_slug, artist_slug, subfeeling_slug, occasion_slugs,
 *   size_table_key, fit_label, related_products, frequently_bought_with,
 *   promo_show_countdown, size_fit_note
 */

export interface MetafieldDef {
  name: string;
  namespace: string;
  key: string;
  type: string;
  description?: string;
  validations?: Array<{ name: string; value?: string }>;
}

export const PRODUCT_METAFIELDS: MetafieldDef[] = [
  {
    name: 'Feeling',
    namespace: 'custom',
    key: 'feeling',
    type: 'metaobject_reference',
    description: 'Primary feeling/vibe reference',
  },
  {
    name: 'Subfeeling',
    namespace: 'custom',
    key: 'subfeeling',
    type: 'metaobject_reference',
    description: 'Sub-feeling refinement reference',
  },
  {
    name: 'Occasions',
    namespace: 'custom',
    key: 'occasions',
    type: 'list.metaobject_reference',
    description: 'One or more occasion references',
  },
  {
    name: 'Artist',
    namespace: 'custom',
    key: 'artist',
    type: 'metaobject_reference',
    description: 'Artist attribution reference',
  },
  {
    name: 'Story',
    namespace: 'custom',
    key: 'story',
    type: 'multi_line_text_field',
    description: 'Emotional short story for product-story section',
  },
  {
    name: 'Story description',
    namespace: 'custom',
    key: 'story_description',
    type: 'rich_text_field',
    description: 'Longer design narrative for collapsible story',
  },
  {
    name: 'Design story',
    namespace: 'custom',
    key: 'design_story',
    type: 'rich_text_field',
    description: 'Design process / inspiration note',
  },
  {
    name: 'Fit note',
    namespace: 'custom',
    key: 'fit_note',
    type: 'multi_line_text_field',
    description: 'Model fit and sizing guidance',
  },
  {
    name: 'Materials',
    namespace: 'custom',
    key: 'materials',
    type: 'rich_text_field',
    description: 'Fabric and print material details',
  },
  {
    name: 'Care instructions',
    namespace: 'custom',
    key: 'care_instructions',
    type: 'rich_text_field',
    description: 'Washing and care guidance',
  },
  {
    name: 'Dimensions note',
    namespace: 'custom',
    key: 'dimensions_note',
    type: 'rich_text_field',
    description: 'Physical dimensions / weight note',
  },
  {
    name: 'Features',
    namespace: 'custom',
    key: 'features',
    type: 'list.single_line_text_field',
    description: 'Product feature chips',
  },
  {
    name: 'Trust chips',
    namespace: 'custom',
    key: 'trust_chips',
    type: 'list.single_line_text_field',
    description: 'Trust/social-proof chips',
  },
  {
    name: 'WhatsApp help URL',
    namespace: 'custom',
    key: 'whatsapp_help_url',
    type: 'url',
    description: 'Direct WhatsApp support link',
  },
  {
    name: 'Size table',
    namespace: 'custom',
    key: 'size_table',
    type: 'metaobject_reference',
    description: 'Reference to a size_table metaobject',
  },
  {
    name: 'Pair with products',
    namespace: 'custom',
    key: 'pair_with_products',
    type: 'list.product_reference',
    description: 'Companion products for pair-with cross-sell',
  },
  {
    name: 'Promo active',
    namespace: 'custom',
    key: 'promo_active',
    type: 'boolean',
    description: 'Whether a promo countdown is active',
  },
  {
    name: 'Promo ends at',
    namespace: 'custom',
    key: 'promo_ends_at',
    type: 'date_time',
    description: 'Promo countdown end timestamp',
  },
  {
    name: 'Promo label',
    namespace: 'custom',
    key: 'promo_label',
    type: 'single_line_text_field',
    description: 'Promo label in English',
  },
  {
    name: 'Promo label (Arabic)',
    namespace: 'custom',
    key: 'promo_label_ar',
    type: 'single_line_text_field',
    description: 'Promo label in Arabic',
  },
  {
    name: 'Promo savings (EGP)',
    namespace: 'custom',
    key: 'promo_savings_egp',
    type: 'number_integer',
    description: 'Optional savings amount for promo countdown',
  },
];
