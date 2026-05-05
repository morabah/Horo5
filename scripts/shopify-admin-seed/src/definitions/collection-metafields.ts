/**
 * HORO collection metafield definitions.
 * Aligned with docs/shopify-final-admin-data-model-lock.md §3.
 */

import type { MetafieldDef } from './product-metafields.js';

export const COLLECTION_METAFIELDS: MetafieldDef[] = [
  {
    name: 'Feeling',
    namespace: 'custom',
    key: 'feeling',
    type: 'metaobject_reference',
    description: 'Links collection to a feeling metaobject',
  },
  {
    name: 'Occasion',
    namespace: 'custom',
    key: 'occasion',
    type: 'metaobject_reference',
    description: 'Links collection to an occasion metaobject',
  },
  {
    name: 'Editorial heading',
    namespace: 'custom',
    key: 'editorial_heading',
    type: 'single_line_text_field',
    description: 'Collection page editorial headline',
  },
  {
    name: 'Editorial text',
    namespace: 'custom',
    key: 'editorial_text',
    type: 'multi_line_text_field',
    description: 'Collection page editorial body',
  },
  {
    name: 'Editorial image',
    namespace: 'custom',
    key: 'editorial_image',
    type: 'file_reference',
    description: 'Collection page editorial image',
  },
  {
    name: 'Hero image',
    namespace: 'custom',
    key: 'hero_image',
    type: 'file_reference',
    description: 'Collection page hero banner',
  },
  {
    name: 'Card image',
    namespace: 'custom',
    key: 'card_image',
    type: 'file_reference',
    description: 'Hub page card thumbnail',
  },
  {
    name: 'Blurb',
    namespace: 'custom',
    key: 'blurb',
    type: 'multi_line_text_field',
    description: 'Short description for cards/lists',
  },
  {
    name: 'Price hint',
    namespace: 'custom',
    key: 'price_hint',
    type: 'single_line_text_field',
    description: 'Pricing context for cards',
  },
  {
    name: 'Is gift occasion',
    namespace: 'custom',
    key: 'is_gift_occasion',
    type: 'boolean',
    description: 'Flags collection as gift-appropriate for gifts hub',
  },
];
