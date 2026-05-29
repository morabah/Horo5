/**
 * HORO product metafield definitions.
 * Aligned with shopify-theme/docs/HORO_DATA_CONTRACT.md §2.
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
  // Taxonomy & identity
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
    description: 'Sub-feeling / line reference',
  },
  {
    name: 'PDP tag labels',
    namespace: 'custom',
    key: 'pdp_tag_labels',
    type: 'list.single_line_text_field',
    description: 'PDP hero chips (not occasions); Medusa pdpTagLabels equivalent',
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
    name: 'Artist display',
    namespace: 'custom',
    key: 'artist_display',
    type: 'single_line_text_field',
    description: 'Fallback artist credit when metaobject is not set',
  },
  // Story
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
    description: 'Deprecated fallback for accordions',
  },
  {
    name: 'Emotional hook',
    namespace: 'custom',
    key: 'emotional_hook',
    type: 'single_line_text_field',
    description: 'For the one who… line',
  },
  {
    name: 'Wearer story',
    namespace: 'custom',
    key: 'wearer_story',
    type: 'rich_text_field',
    description: 'Wearer narrative block',
  },
  {
    name: 'Design prompt',
    namespace: 'custom',
    key: 'design_prompt',
    type: 'single_line_text_field',
    description: 'Short design prompt caption',
  },
  // Fit & size
  {
    name: 'Fit note',
    namespace: 'custom',
    key: 'fit_note',
    type: 'multi_line_text_field',
    description: 'Model fit and sizing guidance (fit chain priority 1)',
  },
  {
    name: 'Fit label',
    namespace: 'custom',
    key: 'fit_label',
    type: 'single_line_text_field',
    description: 'Short fit chip (fit chain priority 2)',
  },
  {
    name: 'Size fit note',
    namespace: 'custom',
    key: 'size_fit_note',
    type: 'single_line_text_field',
    description: 'Fit chain fallback (priority 3)',
  },
  {
    name: 'Size table',
    namespace: 'custom',
    key: 'size_table',
    type: 'metaobject_reference',
    description: 'Reference to a size_table metaobject',
  },
  // Product details
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
    name: 'Shipping returns note',
    namespace: 'custom',
    key: 'shipping_returns_note',
    type: 'rich_text_field',
    description: 'Shipping and returns copy for accordions',
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
  // Gift
  {
    name: 'Giftable',
    namespace: 'custom',
    key: 'giftable',
    type: 'boolean',
    description: 'Product is gift-ready',
  },
  {
    name: 'Gift occasion tags',
    namespace: 'custom',
    key: 'gift_occasion_tags',
    type: 'list.single_line_text_field',
    description: 'Gift routing tags',
  },
  // Support
  {
    name: 'WhatsApp help URL',
    namespace: 'custom',
    key: 'whatsapp_help_url',
    type: 'url',
    description: 'Direct WhatsApp support link',
  },
  {
    name: 'Delivery note',
    namespace: 'custom',
    key: 'delivery_note',
    type: 'single_line_text_field',
    description: 'Delivery expectations copy',
  },
  {
    name: 'Exchange note',
    namespace: 'custom',
    key: 'exchange_note',
    type: 'single_line_text_field',
    description: 'Exchange policy copy',
  },
  // Merchandising & stock
  {
    name: 'Merchandising badge',
    namespace: 'custom',
    key: 'merchandising_badge',
    type: 'single_line_text_field',
    description: 'Card badge e.g. Bestseller, New, Limited',
  },
  {
    name: 'Low stock message',
    namespace: 'custom',
    key: 'low_stock_message',
    type: 'single_line_text_field',
    description: 'Urgency line on PDP',
  },
  {
    name: 'Stock note',
    namespace: 'custom',
    key: 'stock_note',
    type: 'single_line_text_field',
    description: 'Scarcity line for analytics/cards',
  },
  {
    name: 'Garment colors',
    namespace: 'custom',
    key: 'garment_colors',
    type: 'list.single_line_text_field',
    description: 'Display color labels',
  },
  {
    name: 'Available sizes',
    namespace: 'custom',
    key: 'available_sizes',
    type: 'list.single_line_text_field',
    description: 'Optional size list override for analytics',
  },
  // Analytics / readiness
  {
    name: 'Buyer route',
    namespace: 'custom',
    key: 'buyer_route',
    type: 'single_line_text_field',
    description: 'feeling, moment, gift, personality, artist_drop, world',
  },
  {
    name: 'Primary audience',
    namespace: 'custom',
    key: 'primary_audience',
    type: 'single_line_text_field',
    description: 'V1.4 audience label',
  },
  {
    name: 'Feels like',
    namespace: 'custom',
    key: 'feels_like',
    type: 'list.single_line_text_field',
    description: 'Emotional cues',
  },
  {
    name: 'Works for',
    namespace: 'custom',
    key: 'works_for',
    type: 'list.single_line_text_field',
    description: 'Moment/occasion cues',
  },
  // Cross-sell intent buckets
  {
    name: 'Pair with products',
    namespace: 'custom',
    key: 'pair_with_products',
    type: 'list.product_reference',
    description: 'Legacy/general pair-with fallback',
  },
  {
    name: 'Frequently bought with products',
    namespace: 'custom',
    key: 'frequently_bought_with_products',
    type: 'list.product_reference',
    description: 'FBT / bundle intent for product-pair-with',
  },
  {
    name: 'Complementary products',
    namespace: 'custom',
    key: 'complementary_products',
    type: 'list.product_reference',
    description: 'Style-with / visual pairing',
  },
  {
    name: 'Customers also bought products',
    namespace: 'custom',
    key: 'customers_also_bought_products',
    type: 'list.product_reference',
    description: 'Social-proof recommendations for horo-cross-sell',
  },
  // Proof & UGC
  {
    name: 'Proof gallery',
    namespace: 'custom',
    key: 'proof_gallery',
    type: 'list.metaobject_reference',
    description: 'proof_item metaobjects for proof strip',
  },
  {
    name: 'Review proof',
    namespace: 'custom',
    key: 'review_proof',
    type: 'list.metaobject_reference',
    description: 'ugc_proof entries for Seen on you',
  },
  // Promo
  {
    name: 'Promo active',
    namespace: 'custom',
    key: 'promo_active',
    type: 'boolean',
    description: 'Whether a promo countdown is active',
  },
  {
    name: 'Promo starts at',
    namespace: 'custom',
    key: 'promo_starts_at',
    type: 'date_time',
    description: 'Promo start timestamp',
  },
  {
    name: 'Promo ends at',
    namespace: 'custom',
    key: 'promo_ends_at',
    type: 'date_time',
    description: 'Promo countdown end timestamp',
  },
  {
    name: 'Promo show countdown',
    namespace: 'custom',
    key: 'promo_show_countdown',
    type: 'boolean',
    description: 'Show countdown UI (default true when unset in theme)',
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
  {
    name: 'Launch at',
    namespace: 'custom',
    key: 'launch_at',
    type: 'date_time',
    description: 'Optional launch scheduling',
  },
  {
    name: 'Sunset at',
    namespace: 'custom',
    key: 'sunset_at',
    type: 'date_time',
    description: 'Optional sunset scheduling',
  },
];

/** Product subtitle under title (descriptors namespace). */
export const PRODUCT_DESCRIPTOR_METAFIELDS: MetafieldDef[] = [
  {
    name: 'Subtitle',
    namespace: 'descriptors',
    key: 'subtitle',
    type: 'single_line_text_field',
    description: 'Short line under product title on PDP',
  },
];
