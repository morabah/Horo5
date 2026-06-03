import type { Product } from '../data/catalog-types';

/** One-line meaning for PDP buy box — prefer useCase, then story-led copy. */
export function productMeaningLine(product: Pick<Product, 'useCase' | 'story' | 'name'>): string | undefined {
  const useCase = product.useCase?.trim();
  if (useCase) return useCase;

  const story = product.story?.trim();
  if (!story) return undefined;

  if (/^for the one who/i.test(story)) {
    return story.split(/[.!?]/)[0]?.trim() || story;
  }

  if (story.length <= 120) return story;
  return `${story.slice(0, 117).trim()}…`;
}
