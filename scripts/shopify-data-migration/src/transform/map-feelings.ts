/**
 * Transform extracted feeling data to Shopify metaobject fields.
 * Aligned with locked model: feeling.
 */

import { toSafeHandle } from '../utils/safe-handle.js';

export interface FeelingInput {
  title: string;
  handle?: string;
  description?: string;
  tagline?: string;
  accent_color?: string;
  hero_image?: string;
  card_image?: string;
  manifesto?: string;
  sort_order?: number;
  active?: boolean;
}

export interface FeelingOutput {
  handle: string;
  fields: Array<{ key: string; value: string }>;
}

export function mapFeeling(input: FeelingInput): FeelingOutput {
  const handle = input.handle ?? toSafeHandle(input.title);

  return {
    handle,
    fields: [
      { key: 'title', value: input.title },
      { key: 'description', value: input.description ?? '' },
      { key: 'tagline', value: input.tagline ?? '' },
      { key: 'accent_color', value: input.accent_color ?? '' },
      { key: 'hero_image', value: input.hero_image ?? '' },
      { key: 'card_image', value: input.card_image ?? '' },
      { key: 'manifesto', value: input.manifesto ?? '' },
      { key: 'sort_order', value: String(input.sort_order ?? 0) },
      { key: 'active', value: input.active !== false ? 'true' : 'false' },
    ],
  };
}
