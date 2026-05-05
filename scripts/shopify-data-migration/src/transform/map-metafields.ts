/**
 * Map source data to Shopify metafield values for products and collections.
 * Aligned with locked model.
 */

export interface ProductMetafieldInput {
  feeling?: string;
  subfeeling?: string;
  occasions?: string[];
  artist?: string;
  story?: string;
  story_description?: string;
  design_story?: string;
  fit_note?: string;
  materials?: string;
  care_instructions?: string;
  dimensions_note?: string;
  features?: string[];
  trust_chips?: string[];
  whatsapp_help_url?: string;
  size_table?: string;
  pair_with_products?: string[];
  promo_active?: boolean;
  promo_ends_at?: string;
  promo_label?: string;
  promo_label_ar?: string;
  promo_savings_egp?: number;
}

export interface ProductMetafieldOutput {
  namespace: string;
  key: string;
  value: string;
  type: string;
}

export function mapProductMetafields(input: ProductMetafieldInput): ProductMetafieldOutput[] {
  const fields: ProductMetafieldOutput[] = [];

  const add = (key: string, value: unknown, type: string) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value) && value.length === 0) return;
    fields.push({ namespace: 'custom', key, value: String(value), type });
  };

  add('feeling', input.feeling, 'metaobject_reference');
  add('subfeeling', input.subfeeling, 'metaobject_reference');
  add('occasions', input.occasions?.join(','), 'list.metaobject_reference');
  add('artist', input.artist, 'metaobject_reference');
  add('story', input.story, 'multi_line_text_field');
  add('story_description', input.story_description, 'rich_text_field');
  add('design_story', input.design_story, 'rich_text_field');
  add('fit_note', input.fit_note, 'multi_line_text_field');
  add('materials', input.materials, 'rich_text_field');
  add('care_instructions', input.care_instructions, 'rich_text_field');
  add('dimensions_note', input.dimensions_note, 'rich_text_field');
  add('features', input.features?.join(','), 'list.single_line_text_field');
  add('trust_chips', input.trust_chips?.join(','), 'list.single_line_text_field');
  add('whatsapp_help_url', input.whatsapp_help_url, 'url');
  add('size_table', input.size_table, 'metaobject_reference');
  add('pair_with_products', input.pair_with_products?.join(','), 'list.product_reference');
  add('promo_active', input.promo_active, 'boolean');
  add('promo_ends_at', input.promo_ends_at, 'date_time');
  add('promo_label', input.promo_label, 'single_line_text_field');
  add('promo_label_ar', input.promo_label_ar, 'single_line_text_field');
  add('promo_savings_egp', input.promo_savings_egp, 'number_integer');

  return fields;
}

export interface CollectionMetafieldInput {
  occasion?: string;
  editorial_heading?: string;
  editorial_text?: string;
  editorial_image?: string;
  hero_image?: string;
  card_image?: string;
  blurb?: string;
  price_hint?: string;
  is_gift_occasion?: boolean;
}

export interface CollectionMetafieldOutput {
  namespace: string;
  key: string;
  value: string;
  type: string;
}

export function mapCollectionMetafields(input: CollectionMetafieldInput): CollectionMetafieldOutput[] {
  const fields: CollectionMetafieldOutput[] = [];

  const add = (key: string, value: unknown, type: string) => {
    if (value === undefined || value === null || value === '') return;
    fields.push({ namespace: 'custom', key, value: String(value), type });
  };

  add('occasion', input.occasion, 'metaobject_reference');
  add('editorial_heading', input.editorial_heading, 'single_line_text_field');
  add('editorial_text', input.editorial_text, 'multi_line_text_field');
  add('editorial_image', input.editorial_image, 'file_reference');
  add('hero_image', input.hero_image, 'file_reference');
  add('card_image', input.card_image, 'file_reference');
  add('blurb', input.blurb, 'multi_line_text_field');
  add('price_hint', input.price_hint, 'single_line_text_field');
  add('is_gift_occasion', input.is_gift_occasion, 'boolean');

  return fields;
}
