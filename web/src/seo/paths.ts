import { vibes, occasions, products } from '../data/site';

const INDEXABLE_STATIC_PATHS = [
  '/',
  '/about',
  '/vibes',
  '/occasions',
  '/search',
  '/exchange',
  '/privacy',
  '/terms',
] as const;

/** All indexable public paths for sitemap generation. */
export function getIndexablePublicPaths(): string[] {
  const set = new Set<string>([...INDEXABLE_STATIC_PATHS]);
  for (const v of vibes) set.add(`/vibes/${v.slug}`);
  for (const o of occasions) set.add(`/occasions/${o.slug}`);
  for (const p of products) set.add(`/products/${p.slug}`);
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}
