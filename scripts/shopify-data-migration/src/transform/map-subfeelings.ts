import { toSafeHandle } from '../utils/safe-handle.js';

export interface SubfeelingInput {
  title: string;
  handle?: string;
  parent_feeling: string;
  description?: string;
  hero_image?: string;
  card_image?: string;
  sort_order?: number;
  active?: boolean;
}

export interface SubfeelingOutput {
  handle: string;
  fields: Array<{ key: string; value: string }>;
}

export function mapSubfeeling(input: SubfeelingInput): SubfeelingOutput {
  const handle = input.handle ?? toSafeHandle(input.title);

  return {
    handle,
    fields: [
      { key: 'title', value: input.title },
      { key: 'parent_feeling', value: input.parent_feeling },
      { key: 'description', value: input.description ?? '' },
      { key: 'hero_image', value: input.hero_image ?? '' },
      { key: 'card_image', value: input.card_image ?? '' },
      { key: 'sort_order', value: String(input.sort_order ?? 0) },
      { key: 'active', value: input.active !== false ? 'true' : 'false' },
    ],
  };
}
