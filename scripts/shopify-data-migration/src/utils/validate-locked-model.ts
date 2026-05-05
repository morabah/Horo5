/**
 * Validate that required metaobject and metafield definitions exist
 * before attempting content migration.
 */

export interface DefinitionCheck {
  metaobjectTypes: string[];
  productMetafieldKeys: string[];
  collectionMetafieldKeys: string[];
}

export const REQUIRED_DEFINITIONS: DefinitionCheck = {
  metaobjectTypes: ['feeling', 'subfeeling', 'occasion', 'artist', 'size_table'],
  productMetafieldKeys: [
    'custom.feeling',
    'custom.subfeeling',
    'custom.occasions',
    'custom.artist',
    'custom.story',
    'custom.fit_note',
    'custom.materials',
    'custom.trust_chips',
    'custom.whatsapp_help_url',
    'custom.size_table',
    'custom.pair_with_products',
  ],
  collectionMetafieldKeys: [
    'custom.feeling',
    'custom.occasion',
    'custom.editorial_heading',
    'custom.hero_image',
    'custom.blurb',
    'custom.price_hint',
    'custom.is_gift_occasion',
  ],
};
