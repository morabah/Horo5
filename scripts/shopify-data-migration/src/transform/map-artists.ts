import { toSafeHandle } from '../utils/safe-handle.js';

export interface ArtistInput {
  name: string;
  slug?: string;
  style?: string;
  bio?: string;
  avatar?: string;
  portfolio_url?: string;
  design_count?: number;
  active?: boolean;
}

export interface ArtistOutput {
  slug: string;
  fields: Array<{ key: string; value: string }>;
}

export function mapArtist(input: ArtistInput): ArtistOutput {
  const slug = input.slug ?? toSafeHandle(input.name);

  return {
    slug,
    fields: [
      { key: 'name', value: input.name },
      { key: 'slug', value: slug },
      { key: 'style', value: input.style ?? '' },
      { key: 'bio', value: input.bio ?? '' },
      { key: 'avatar', value: input.avatar ?? '' },
      { key: 'portfolio_url', value: input.portfolio_url ?? '' },
      { key: 'design_count', value: String(input.design_count ?? 0) },
      { key: 'active', value: input.active !== false ? 'true' : 'false' },
    ],
  };
}
