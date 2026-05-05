import { toSafeHandle } from '../utils/safe-handle.js';

export interface OccasionInput {
  title: string;
  handle?: string;
  description?: string;
  accent_color?: string;
  hero_image?: string;
  card_image?: string;
  is_gift_occasion?: boolean;
  price_hint?: string;
  sort_order?: number;
  active?: boolean;
}

export interface OccasionOutput {
  handle: string;
  fields: Array<{ key: string; value: string }>;
}

export function mapOccasion(input: OccasionInput): OccasionOutput {
  const handle = input.handle ?? toSafeHandle(input.title);

  return {
    handle,
    fields: [
      { key: 'title', value: input.title },
      { key: 'description', value: input.description ?? '' },
      { key: 'accent_color', value: input.accent_color ?? '' },
      { key: 'hero_image', value: input.hero_image ?? '' },
      { key: 'card_image', value: input.card_image ?? '' },
      { key: 'is_gift_occasion', value: input.is_gift_occasion === true ? 'true' : 'false' },
      { key: 'price_hint', value: input.price_hint ?? '' },
      { key: 'sort_order', value: String(input.sort_order ?? 0) },
      { key: 'active', value: input.active !== false ? 'true' : 'false' },
    ],
  };
}
