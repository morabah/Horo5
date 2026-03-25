import { artistAvatars, getProductMedia, heroStreet, vibeCovers } from '../data/images';
import { artists, getArtist, getOccasion, getVibe, products, vibes, type Artist, type OccasionSlug, type Product } from '../data/site';
import { sortProductList, type ProductSortKey } from '../utils/productSort';

export type SearchTab = 'designs' | 'vibes' | 'artists';
export type SearchPriceFilter = 'all' | 'under-800' | '800-899' | '900+';
export type SearchSortKey = 'relevance' | ProductSortKey;

export type SearchDesignCard = {
  slug: string;
  name: string;
  artistSlug: string;
  artistName?: string;
  vibeSlug: string;
  vibeName?: string;
  vibeAccent?: string;
  priceEgp: number;
  imageSrc: string;
  imageAlt: string;
  merchandisingBadge?: string;
};

export type SearchVibeCard = {
  slug: string;
  name: string;
  tagline: string;
  accent: string;
  designCount: number;
  imageSrc: string;
  imageAlt: string;
};

export type SearchArtistCard = {
  slug: string;
  name: string;
  style: string;
  designCount: number;
  imageSrc: string;
  imageAlt: string;
};

export type SearchOption = {
  slug: string;
  name: string;
};

export type SearchResults = {
  baseDesigns: SearchDesignCard[];
  designMatches: SearchDesignCard[];
  vibeMatches: SearchVibeCard[];
  artistMatches: SearchArtistCard[];
  vibeOptions: SearchOption[];
  artistOptions: SearchOption[];
  rawDesignMatchCount: number;
};

type ScopedSearchParams = {
  query: string;
  scopeVibeSlug?: string | null;
  scopeOccasionSlug?: string | null;
  sortKey: SearchSortKey;
  priceFilter: SearchPriceFilter;
  vibeFilter: string;
  artistSlug: string;
};

type ScoredProduct = {
  product: Product;
  score: number;
};

type ScoredArtist = {
  artist: Artist;
  score: number;
  designCount: number;
};

function catalogIndex(product: Product): number {
  const index = products.findIndex((entry) => entry.slug === product.slug);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

export function normalizeForSearch(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

function tokenize(value: string): string[] {
  return normalizeForSearch(value).split(/\s+/).filter(Boolean);
}

function fieldScore(fieldValue: string, query: string, weights: { exact: number; includes: number; token: number; allTokens: number }) {
  const normalizedField = normalizeForSearch(fieldValue);
  if (!normalizedField || !query) return 0;

  let score = 0;
  if (normalizedField === query) score += weights.exact;
  else if (normalizedField.includes(query)) score += weights.includes;

  const tokens = tokenize(query);
  if (!tokens.length) return score;

  const matchedTokens = tokens.filter((token) => normalizedField.includes(token));
  score += matchedTokens.length * weights.token;
  if (matchedTokens.length === tokens.length) score += weights.allTokens;
  if (tokens.some((token) => normalizedField.startsWith(token))) score += Math.ceil(weights.token / 2);

  return score;
}

function filterByPrice(list: Product[], filter: SearchPriceFilter) {
  switch (filter) {
    case 'under-800':
      return list.filter((product) => product.priceEgp < 800);
    case '800-899':
      return list.filter((product) => product.priceEgp >= 800 && product.priceEgp < 900);
    case '900+':
      return list.filter((product) => product.priceEgp >= 900);
    default:
      return list;
  }
}

function productOccasionNames(product: Product) {
  return product.occasionSlugs
    .map((occasionSlug) => getOccasion(occasionSlug)?.name ?? occasionSlug.replace(/-/g, ' '))
    .join(' ');
}

function productScore(product: Product, query: string): number {
  if (!query) return 0;
  const artist = getArtist(product.artistSlug);
  const vibe = getVibe(product.vibeSlug);

  return (
    fieldScore(product.name, query, { exact: 160, includes: 120, token: 22, allTokens: 28 }) +
    fieldScore(artist?.name ?? product.artistSlug.replace(/-/g, ' '), query, { exact: 92, includes: 72, token: 16, allTokens: 20 }) +
    fieldScore(vibe?.name ?? product.vibeSlug.replace(/-/g, ' '), query, { exact: 72, includes: 54, token: 12, allTokens: 14 }) +
    fieldScore(productOccasionNames(product), query, { exact: 60, includes: 42, token: 10, allTokens: 12 }) +
    fieldScore(product.story, query, { exact: 28, includes: 20, token: 6, allTokens: 8 })
  );
}

function vibeScore(vibeSlug: string, query: string): number {
  if (!query) return 0;
  const vibe = getVibe(vibeSlug);
  if (!vibe) return 0;

  return (
    fieldScore(vibe.name, query, { exact: 120, includes: 88, token: 18, allTokens: 22 }) +
    fieldScore(vibe.tagline, query, { exact: 32, includes: 24, token: 8, allTokens: 10 })
  );
}

function artistScore(artist: Artist, query: string): number {
  if (!query) return 0;
  return (
    fieldScore(artist.name, query, { exact: 120, includes: 86, token: 18, allTokens: 22 }) +
    fieldScore(artist.style, query, { exact: 24, includes: 18, token: 6, allTokens: 8 })
  );
}

function mapDesignCard(product: Product): SearchDesignCard {
  const artist = getArtist(product.artistSlug);
  const vibe = getVibe(product.vibeSlug);
  const media = getProductMedia(product.slug);

  return {
    slug: product.slug,
    name: product.name,
    artistSlug: product.artistSlug,
    artistName: artist?.name,
    vibeSlug: product.vibeSlug,
    vibeName: vibe?.name,
    vibeAccent: vibe?.accent,
    priceEgp: product.priceEgp,
    imageSrc: media.main,
    imageAlt: `HORO “${product.name}” graphic tee${artist ? ` by ${artist.name}` : ''}${vibe ? ` in the ${vibe.name} vibe` : ''}.`,
    merchandisingBadge: product.merchandisingBadge,
  };
}

function mapVibeCard(vibeSlug: string, designCount: number): SearchVibeCard | null {
  const vibe = getVibe(vibeSlug);
  if (!vibe) return null;

  return {
    slug: vibe.slug,
    name: vibe.name,
    tagline: vibe.tagline,
    accent: vibe.accent,
    designCount,
    imageSrc: vibeCovers[vibe.slug] ?? heroStreet,
    imageAlt: `${vibe.name} vibe — HORO editorial styling.`,
  };
}

function mapArtistCard(artist: Artist, designCount: number): SearchArtistCard {
  return {
    slug: artist.slug,
    name: artist.name,
    style: artist.style,
    designCount,
    imageSrc: artistAvatars[artist.slug] ?? heroStreet,
    imageAlt: `${artist.name} artist portrait for HORO.`,
  };
}

function optionName(type: 'artist' | 'vibe', slug: string): string {
  if (type === 'artist') return getArtist(slug)?.name ?? slug;
  return getVibe(slug)?.name ?? slug;
}

export function getSearchResults({
  query,
  scopeVibeSlug,
  scopeOccasionSlug,
  sortKey,
  priceFilter,
  vibeFilter,
  artistSlug,
}: ScopedSearchParams): SearchResults {
  const normalizedQuery = normalizeForSearch(query);

  let baseProducts = products;
  if (scopeVibeSlug) baseProducts = baseProducts.filter((product) => product.vibeSlug === scopeVibeSlug);
  if (scopeOccasionSlug) baseProducts = baseProducts.filter((product) => product.occasionSlugs.includes(scopeOccasionSlug as OccasionSlug));

  const scopedArtistCounts = new Map<string, number>();
  const scopedVibeCounts = new Map<string, number>();

  for (const product of baseProducts) {
    scopedArtistCounts.set(product.artistSlug, (scopedArtistCounts.get(product.artistSlug) ?? 0) + 1);
    scopedVibeCounts.set(product.vibeSlug, (scopedVibeCounts.get(product.vibeSlug) ?? 0) + 1);
  }

  const scoredProducts: ScoredProduct[] = baseProducts
    .map((product) => ({ product, score: productScore(product, normalizedQuery) }))
    .filter((entry) => !normalizedQuery || entry.score > 0);

  const queryMatchedProducts = scoredProducts.map((entry) => entry.product);
  const scoreBySlug = new Map(scoredProducts.map((entry) => [entry.product.slug, entry.score]));

  const filteredProducts = filterByPrice(
    queryMatchedProducts.filter((product) => {
      if (vibeFilter !== 'all' && product.vibeSlug !== vibeFilter) return false;
      if (artistSlug !== 'all' && product.artistSlug !== artistSlug) return false;
      return true;
    }),
    priceFilter,
  );

  let sortedProducts = filteredProducts;
  if (sortKey === 'relevance') {
    sortedProducts = [...filteredProducts].sort((a, b) => {
      if (!normalizedQuery) return catalogIndex(a) - catalogIndex(b);
      const scoreDelta = (scoreBySlug.get(b.slug) ?? 0) - (scoreBySlug.get(a.slug) ?? 0);
      if (scoreDelta !== 0) return scoreDelta;
      return catalogIndex(a) - catalogIndex(b);
    });
  } else {
    sortedProducts = sortProductList(filteredProducts, sortKey);
  }

  const matchedVibeSlugs = normalizedQuery
    ? vibes
      .filter((vibe) => scopedVibeCounts.has(vibe.slug))
      .map((vibe) => ({ vibe, score: vibeScore(vibe.slug, normalizedQuery) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || a.vibe.name.localeCompare(b.vibe.name))
      .map((entry) => entry.vibe.slug)
    : vibes.filter((vibe) => scopedVibeCounts.has(vibe.slug)).map((vibe) => vibe.slug);

  const matchedArtists: ScoredArtist[] = artists
    .filter((artist) => scopedArtistCounts.has(artist.slug))
    .map((artist) => ({
      artist,
      score: artistScore(artist, normalizedQuery),
      designCount: scopedArtistCounts.get(artist.slug) ?? artist.designCount,
    }))
    .filter((entry) => !normalizedQuery || entry.score > 0)
    .sort((a, b) => {
      if (!normalizedQuery) return a.artist.name.localeCompare(b.artist.name);
      return b.score - a.score || a.artist.name.localeCompare(b.artist.name);
    });

  const vibeOptions = [...new Set(queryMatchedProducts.map((product) => product.vibeSlug))]
    .sort((a, b) => optionName('vibe', a).localeCompare(optionName('vibe', b)))
    .map((slug) => ({ slug, name: optionName('vibe', slug) }));

  const artistOptions = [...new Set(queryMatchedProducts.map((product) => product.artistSlug))]
    .sort((a, b) => optionName('artist', a).localeCompare(optionName('artist', b)))
    .map((slug) => ({ slug, name: optionName('artist', slug) }));

  return {
    baseDesigns: baseProducts.map(mapDesignCard),
    designMatches: sortedProducts.map(mapDesignCard),
    vibeMatches: matchedVibeSlugs
      .map((slug) => mapVibeCard(slug, scopedVibeCounts.get(slug) ?? 0))
      .filter((entry): entry is SearchVibeCard => entry !== null),
    artistMatches: matchedArtists.map((entry) => mapArtistCard(entry.artist, entry.designCount)),
    vibeOptions,
    artistOptions,
    rawDesignMatchCount: queryMatchedProducts.length,
  };
}
