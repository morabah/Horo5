import { SEARCH_SYNONYMS_SCHEMA } from '../data/domain-config';
import {
  ADDITIONAL_COMMON_QUERY_EXPANSIONS,
  ADDITIONAL_FEELING_ALIASES,
  ADDITIONAL_OCCASION_ALIASES,
} from '../data/searchSynonyms';
import { getFeelingCollectionVisual, getOccasionCollectionVisual, getProductMedia, heroStreet } from '../data/images';
import { LEGACY_VIBE_SLUG_TO_FEELING_SLUG } from '../data/legacy-slugs';
import {
  getArtist,
  getFeeling,
  getFeelings,
  getOccasion,
  getOccasions,
  getProducts,
  type OccasionSlug,
  type Product,
  type ProductSizeKey,
} from '../data/site';
import { productHasCatalogSize } from '../utils/productSizes';
import { sortProductList, type ProductSortKey } from '../utils/productSort';

export type SearchPriceFilter = 'all' | 'under-800' | '800-899' | '900+';
export type SearchSizeFilter = 'all' | ProductSizeKey;
export type SearchSortKey = 'relevance' | ProductSortKey;
export type SearchSuggestionKind = 'design' | 'vibe' | 'occasion';
export type SearchSuggestionGroupKind = 'designs' | 'vibes' | 'occasions';

export type SearchDesignCard = {
  slug: string;
  name: string;
  feelingSlug: string;
  feelingName?: string;
  feelingAccent?: string;
  originalPriceEgp?: number | null;
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

export type SearchOccasionCard = {
  slug: string;
  name: string;
  blurb: string;
  isGiftOccasion: boolean;
  priceHint?: string;
  imageSrc: string;
  imageAlt: string;
};

export type SearchOption = {
  slug: string;
  name: string;
};

export type SearchSuggestion = {
  id: string;
  kind: SearchSuggestionKind;
  label: string;
  meta: string;
  href: string;
  imageSrc: string;
  imageAlt: string;
  accent?: string;
};

export type SearchSuggestionGroup = {
  kind: SearchSuggestionGroupKind;
  suggestions: SearchSuggestion[];
};

export type SearchResults = {
  baseDesigns: SearchDesignCard[];
  designMatches: SearchDesignCard[];
  vibeMatches: SearchVibeCard[];
  occasionMatches: SearchOccasionCard[];
  vibeOptions: SearchOption[];
  rawDesignMatchCount: number;
};

type ScopedSearchParams = {
  query: string;
  scopeFeelingSlug?: string | null;
  scopeOccasionSlug?: string | null;
  sortKey: SearchSortKey;
  priceFilter: SearchPriceFilter;
  feelingFilter: string;
  sizeFilter: SearchSizeFilter;
  filterArtist: string;
  filterOccasion: string;
  filterColor: string;
};

const PRODUCT_SIZE_KEYS: ProductSizeKey[] = ['S', 'M', 'L', 'XL', 'XXL'];

export function parseSearchSizeFilter(raw: string | null | undefined): SearchSizeFilter {
  if (raw == null || raw === '' || raw === 'all') return 'all';
  return PRODUCT_SIZE_KEYS.includes(raw as ProductSizeKey) ? (raw as ProductSizeKey) : 'all';
}

type SearchSuggestionsParams = {
  query: string;
  scopeFeelingSlug?: string | null;
  scopeOccasionSlug?: string | null;
  limitPerGroup?: number;
};

type ScoredProduct = {
  product: Product;
  score: number;
};

const FEELING_ALIAS_MAP: Record<string, string[]> = {
  mood: [
    'emotion',
    'emotional',
    'feelings',
    'feeling',
    'mood',
    'moods',
    'soft thoughtful',
    'soft and thoughtful',
    'emotions',
    'مشاعر',
    'احاسيس',
    'أحاسيس',
    'احساس',
    'أحاسيسي',
    'مزاج',
  ],
  zodiac: [
    'astro',
    'astrology',
    'sign',
    'signs',
    'cosmic',
    'horoscope',
    'zodiac',
    'ابراج',
    'أبراج',
    'برج',
    'فلك',
  ],
  fiction: [
    'story',
    'stories',
    'fantasy',
    'character',
    'characters',
    'fictional',
    'fiction',
    'weird wonderful',
    'weird and wonderful',
    'خيال',
    'خيالي',
    'قصه',
    'قصة',
    'قصص',
  ],
  career: [
    'work',
    'office',
    'ambition',
    'professional',
    'graduation',
    'career',
    'proud rooted',
    'proud and rooted',
    'شغل',
    'عمل',
    'مهنه',
    'مهنة',
    'تخرج',
    'نجاح',
  ],
  trends: [
    'trend',
    'trending',
    'streetwear',
    'viral',
    'hype',
    'fashion',
    'trends',
    'bold loud',
    'bold and loud',
    'ترند',
    'موضه',
    'موضة',
    'ستايل',
  ],
};

const OCCASION_ALIAS_MAP: Record<OccasionSlug, string[]> = {
  'gift-something-real': ['gift', 'gifting', 'present', 'surprise', 'هدية', 'هديه', 'هدايا'],
  'graduation-season': ['graduation', 'grad', 'success', 'achievement', 'تخرج', 'نجاح', 'تسليم', 'مناسبه التخرج'],
  'eid-and-ramadan': ['eid', 'ramadan', 'seasonal', 'festive', 'عيد', 'رمضان', 'موسم', 'فطار'],
  'birthday-pick': ['birthday', 'birthdays', 'party', 'celebration', 'عيد ميلاد', 'ميلاد', 'حفلة'],
  'just-because': ['self gift', 'self-care', 'casual', 'everyday', 'treat', 'بدون سبب', 'على طول', 'كل يوم'],
};

const FEELING_ALIAS_MERGED: Record<string, string[]> = (() => {
  const merged: Record<string, string[]> = { ...FEELING_ALIAS_MAP };
  for (const [k, v] of Object.entries(ADDITIONAL_FEELING_ALIASES)) {
    merged[k] = [...(merged[k] ?? []), ...v];
  }
  return merged;
})();

const OCCASION_ALIAS_MERGED: Record<string, string[]> = (() => {
  const merged: Record<string, string[]> = { ...OCCASION_ALIAS_MAP };
  for (const [k, v] of Object.entries(ADDITIONAL_OCCASION_ALIASES)) {
    merged[k] = [...(merged[k] ?? []), ...v];
  }
  return merged;
})();

const COMMON_QUERY_EXPANSIONS: Record<string, string[]> = {
  '220 gsm': ['220 gsm cotton', 'graphic tee'],
  cotton: ['220 gsm cotton', 'graphic tee'],
  tee: ['graphic tee', 't shirt', 't-shirt'],
  tshirt: ['graphic tee', 't shirt', 't-shirt'],
  't shirt': ['graphic tee', 't-shirt'],
  't-shirt': ['graphic tee', 't shirt'],
  تيشيرت: ['graphic tee', 't-shirt'],
  قطن: ['220 gsm cotton', 'graphic tee'],
  هدية: ['gift something real', 'birthday pick'],
  هديه: ['gift something real', 'birthday pick'],
};

function productFeelingSlug(product: Product): string {
  return product.primaryFeelingSlug ?? product.feelingSlug;
}

function catalogIndex(product: Product): number {
  const index = getProducts().findIndex((entry) => entry.slug === product.slug);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

export function normalizeForSearch(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[\u064B-\u065F\u0670]/gu, '')
    .replace(/[أإآ]/gu, 'ا')
    .replace(/ى/gu, 'ي')
    .replace(/ة/gu, 'ه')
    .replace(/[ؤ]/gu, 'و')
    .replace(/[ئ]/gu, 'ي')
    .replace(/&/g, ' and ')
    .replace(/[^\p{L}\p{N}\s-]+/gu, ' ')
    .replace(/[-_/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(value: string): string[] {
  return normalizeForSearch(value).split(/\s+/).filter(Boolean);
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map(normalizeForSearch).filter(Boolean))];
}

function maxEditDistance(token: string) {
  if (token.length <= 4) return 1;
  if (token.length <= 8) return 2;
  return 3;
}

function editDistanceWithinLimit(a: string, b: string, limit: number) {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > limit) return limit + 1;

  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let current = [i];
    let rowMin = current[0];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const value = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
      current[j] = value;
      rowMin = Math.min(rowMin, value);
    }
    if (rowMin > limit) return limit + 1;
    previous = current;
  }
  return previous[b.length];
}

function fuzzyTokenScore(fieldTokens: string[], queryTokens: string[], weight: number) {
  if (!fieldTokens.length || !queryTokens.length) return 0;

  let score = 0;
  for (const token of queryTokens) {
    const threshold = maxEditDistance(token);
    const exactMatch = fieldTokens.some((fieldToken) => fieldToken === token);
    if (exactMatch) {
      score += weight;
      continue;
    }
    const prefixMatch = fieldTokens.some((fieldToken) => fieldToken.startsWith(token) || token.startsWith(fieldToken));
    if (prefixMatch) {
      score += Math.ceil(weight * 0.85);
      continue;
    }
    const fuzzyMatch = fieldTokens.some((fieldToken) => editDistanceWithinLimit(fieldToken, token, threshold) <= threshold);
    if (fuzzyMatch) score += Math.ceil(weight * 0.6);
  }

  return score;
}

function expandQueryVariants(query: string): string[] {
  const normalizedQuery = normalizeForSearch(query);
  if (!normalizedQuery) return [];

  const variants = new Set<string>([normalizedQuery]);
  const tokens = tokenize(normalizedQuery);

  for (const [slug, aliases] of Object.entries(FEELING_ALIAS_MERGED)) {
    const feeling = getFeeling(slug);
    if (!feeling) continue;
    const normalizedAliases = uniqueStrings(aliases);
    if (normalizedAliases.some((alias) => normalizedQuery.includes(alias) || tokens.includes(alias))) {
      variants.add(normalizeForSearch(feeling.name));
      variants.add(normalizeForSearch(slug.replace(/-/g, ' ')));
      variants.add(normalizeForSearch(feeling.tagline));
    }
  }

  for (const [slug, aliases] of Object.entries(OCCASION_ALIAS_MERGED) as [OccasionSlug, string[]][]) {
    const occasion = getOccasion(slug);
    if (!occasion) continue;
    const normalizedAliases = uniqueStrings(aliases);
    if (normalizedAliases.some((alias) => normalizedQuery.includes(alias) || tokens.includes(alias))) {
      variants.add(normalizeForSearch(occasion.name));
      variants.add(normalizeForSearch(slug.replace(/-/g, ' ')));
      variants.add(normalizeForSearch(occasion.blurb));
    }
  }

  for (const [term, expansions] of Object.entries(COMMON_QUERY_EXPANSIONS)) {
    if (normalizedQuery.includes(normalizeForSearch(term))) {
      expansions.forEach((value) => variants.add(normalizeForSearch(value)));
    }
  }

  for (const [term, expansions] of Object.entries(ADDITIONAL_COMMON_QUERY_EXPANSIONS)) {
    if (normalizedQuery.includes(normalizeForSearch(term))) {
      expansions.forEach((value) => variants.add(normalizeForSearch(value)));
    }
  }

  for (const [term, expansions] of Object.entries(SEARCH_SYNONYMS_SCHEMA)) {
    const nt = normalizeForSearch(term);
    if (normalizedQuery.includes(nt) || tokens.includes(nt)) {
      expansions.forEach((value) => variants.add(normalizeForSearch(value)));
    }
  }

  return [...variants];
}

function fieldScore(
  fieldValue: string,
  queryVariants: string[],
  weights: { exact: number; includes: number; token: number; allTokens: number; fuzzy?: number },
) {
  const normalizedField = normalizeForSearch(fieldValue);
  if (!normalizedField || queryVariants.length === 0) return 0;

  const fieldTokens = tokenize(normalizedField);
  let bestScore = 0;

  for (const query of queryVariants) {
    let score = 0;
    if (normalizedField === query) score += weights.exact;
    else if (normalizedField.includes(query)) score += weights.includes;

    const queryTokens = tokenize(query);
    if (!queryTokens.length) {
      bestScore = Math.max(bestScore, score);
      continue;
    }

    const matchedTokens = queryTokens.filter((token) => normalizedField.includes(token));
    score += matchedTokens.length * weights.token;
    if (matchedTokens.length === queryTokens.length) score += weights.allTokens;
    score += fuzzyTokenScore(fieldTokens, queryTokens, weights.fuzzy ?? Math.max(2, Math.floor(weights.token / 2)));

    bestScore = Math.max(bestScore, score);
  }

  return bestScore;
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

function productGarmentColorLabels(product: Product): string[] {
  return product.garmentColors?.length ? [...product.garmentColors] : ['Black'];
}

function productOccasionNames(product: Product) {
  return product.occasionSlugs
    .map((occasionSlug) => getOccasion(occasionSlug)?.name ?? occasionSlug.replace(/-/g, ' '))
    .join(' ');
}

function productSearchTerms(product: Product) {
  const feelingSlug = productFeelingSlug(product);
  const feeling = getFeeling(feelingSlug);
  const occasionNames = productOccasionNames(product);
  const aliases = [
    ...(FEELING_ALIAS_MAP[feelingSlug] ?? []),
    ...product.occasionSlugs.flatMap((occasionSlug) => OCCASION_ALIAS_MAP[occasionSlug] ?? []),
  ];

  return [product.name, feeling?.name ?? feelingSlug, feeling?.tagline ?? '', occasionNames, product.story, '220 GSM cotton graphic tee', ...aliases]
    .filter(Boolean)
    .join(' ');
}

function productScore(product: Product, queryVariants: string[]): number {
  if (queryVariants.length === 0) return 0;
  const artist = getArtist(product.artistSlug);
  const feelingSlug = productFeelingSlug(product);
  const feeling = getFeeling(feelingSlug);

  return (
    fieldScore(product.name, queryVariants, { exact: 180, includes: 132, token: 24, allTokens: 28, fuzzy: 14 }) +
    fieldScore(productSearchTerms(product), queryVariants, { exact: 120, includes: 86, token: 18, allTokens: 22, fuzzy: 12 }) +
    fieldScore(artist?.name ?? product.artistSlug.replace(/-/g, ' '), queryVariants, {
      exact: 78,
      includes: 58,
      token: 12,
      allTokens: 16,
      fuzzy: 10,
    }) +
    fieldScore(feeling?.name ?? feelingSlug.replace(/-/g, ' '), queryVariants, {
      exact: 72,
      includes: 54,
      token: 12,
      allTokens: 14,
      fuzzy: 8,
    })
  );
}

function feelingScore(feelingSlug: string, queryVariants: string[]): number {
  const feeling = getFeeling(feelingSlug);
  if (!feeling || queryVariants.length === 0) return 0;

  return (
    fieldScore(feeling.name, queryVariants, { exact: 120, includes: 88, token: 18, allTokens: 22, fuzzy: 10 }) +
    fieldScore(feeling.tagline, queryVariants, { exact: 36, includes: 26, token: 8, allTokens: 10, fuzzy: 6 }) +
    fieldScore(FEELING_ALIAS_MAP[feelingSlug]?.join(' ') ?? '', queryVariants, {
      exact: 62,
      includes: 44,
      token: 10,
      allTokens: 12,
      fuzzy: 8,
    })
  );
}

function occasionScore(occasionSlug: OccasionSlug, queryVariants: string[]): number {
  const occasion = getOccasion(occasionSlug);
  if (!occasion || queryVariants.length === 0) return 0;

  return (
    fieldScore(occasion.name, queryVariants, { exact: 118, includes: 84, token: 18, allTokens: 22, fuzzy: 10 }) +
    fieldScore(occasion.blurb, queryVariants, { exact: 42, includes: 28, token: 8, allTokens: 10, fuzzy: 6 }) +
    fieldScore(OCCASION_ALIAS_MAP[occasionSlug]?.join(' ') ?? '', queryVariants, {
      exact: 70,
      includes: 46,
      token: 11,
      allTokens: 14,
      fuzzy: 8,
    })
  );
}

function mapDesignCard(product: Product): SearchDesignCard {
  const feelingSlug = productFeelingSlug(product);
  const feeling = getFeeling(feelingSlug);
  const media = getProductMedia(product.slug);

  return {
    slug: product.slug,
    name: product.name,
    feelingSlug,
    feelingName: feeling?.name,
    feelingAccent: feeling?.accent,
    originalPriceEgp: product.originalPriceEgp,
    priceEgp: product.priceEgp,
    imageSrc: media.main,
    imageAlt: `HORO “${product.name}” graphic tee${feeling ? ` — ${feeling.name}` : ''}.`,
    merchandisingBadge: product.merchandisingBadge,
  };
}

function mapVibeCard(feelingSlug: string, designCount: number): SearchVibeCard | null {
  const feeling = getFeeling(feelingSlug);
  if (!feeling) return null;

  return {
    slug: feeling.slug,
    name: feeling.name,
    tagline: feeling.tagline,
    accent: feeling.accent,
    designCount,
    imageSrc: getFeelingCollectionVisual(feeling.slug).cover.src || heroStreet,
    imageAlt: `${feeling.name} — HORO editorial styling.`,
  };
}

function mapOccasionCard(occasionSlug: OccasionSlug, designCount: number): SearchOccasionCard | null {
  const occasion = getOccasion(occasionSlug);
  if (!occasion) return null;
  const visual = getOccasionCollectionVisual(occasionSlug).hero;

  return {
    slug: occasion.slug,
    name: occasion.name,
    blurb: `${occasion.blurb}${designCount > 0 ? ` · ${designCount} design${designCount === 1 ? '' : 's'}` : ''}`,
    isGiftOccasion: occasion.isGiftOccasion,
    priceHint: occasion.priceHint,
    imageSrc: visual.src,
    imageAlt: visual.alt,
  };
}

function optionName(slug: string): string {
  return getFeeling(slug)?.name ?? slug;
}

function resolveFeelingSlugParam(raw: string) {
  return LEGACY_VIBE_SLUG_TO_FEELING_SLUG[raw] ?? raw;
}

function getScopedProducts(scopeFeelingSlug?: string | null, scopeOccasionSlug?: string | null) {
  let baseProducts = getProducts();
  if (scopeFeelingSlug) {
    const resolved = resolveFeelingSlugParam(scopeFeelingSlug);
    baseProducts = baseProducts.filter((product) => productFeelingSlug(product) === resolved);
  }
  if (scopeOccasionSlug) baseProducts = baseProducts.filter((product) => product.occasionSlugs.includes(scopeOccasionSlug as OccasionSlug));
  return baseProducts;
}

export function getSearchFacetOptions(scopeFeelingSlug?: string | null, scopeOccasionSlug?: string | null) {
  const baseProducts = getScopedProducts(scopeFeelingSlug, scopeOccasionSlug);
  const artistMap = new Map<string, string>();
  const occasionMap = new Map<OccasionSlug, string>();
  const colors = new Set<string>();

  for (const p of baseProducts) {
    const artist = getArtist(p.artistSlug);
    artistMap.set(p.artistSlug, artist?.name ?? p.artistSlug.replace(/-/g, ' '));
    for (const o of p.occasionSlugs) {
      occasionMap.set(o, getOccasion(o)?.name ?? o.replace(/-/g, ' '));
    }
    for (const c of productGarmentColorLabels(p)) {
      colors.add(c);
    }
  }

  return {
    artistOptions: [...artistMap]
      .map(([slug, name]) => ({ slug, name }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    occasionOptions: [...occasionMap]
      .map(([slug, name]) => ({ slug, name }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    colorOptions: [...colors].sort((a, b) => a.localeCompare(b)),
  };
}

function getScopedCounts(baseProducts: Product[]) {
  const vibeCounts = new Map<string, number>();
  const occasionCounts = new Map<OccasionSlug, number>();

  for (const product of baseProducts) {
    const feelingSlug = productFeelingSlug(product);
    vibeCounts.set(feelingSlug, (vibeCounts.get(feelingSlug) ?? 0) + 1);
    for (const occasionSlug of product.occasionSlugs) {
      occasionCounts.set(occasionSlug, (occasionCounts.get(occasionSlug) ?? 0) + 1);
    }
  }

  return { vibeCounts, occasionCounts };
}

function getMatchedVibes(vibeCounts: Map<string, number>, queryVariants: string[]) {
  const feelingList = getFeelings();
  const matchedVibeSlugs = queryVariants.length
    ? feelingList
      .filter((feeling) => vibeCounts.has(feeling.slug))
      .map((feeling) => ({ feeling, score: feelingScore(feeling.slug, queryVariants) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || a.feeling.name.localeCompare(b.feeling.name))
      .map((entry) => entry.feeling.slug)
    : feelingList.filter((feeling) => vibeCounts.has(feeling.slug)).map((feeling) => feeling.slug);

  return matchedVibeSlugs
    .map((slug) => mapVibeCard(slug, vibeCounts.get(slug) ?? 0))
    .filter((entry): entry is SearchVibeCard => entry !== null);
}

function getMatchedOccasions(occasionCounts: Map<OccasionSlug, number>, queryVariants: string[]) {
  const occasionList = getOccasions();
  const matchedOccasionSlugs = queryVariants.length
    ? occasionList
      .filter((occasion) => occasionCounts.has(occasion.slug))
      .map((occasion) => ({ occasion, score: occasionScore(occasion.slug, queryVariants) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || a.occasion.name.localeCompare(b.occasion.name))
      .map((entry) => entry.occasion.slug)
    : occasionList.filter((occasion) => occasionCounts.has(occasion.slug)).map((occasion) => occasion.slug);

  return matchedOccasionSlugs
    .map((slug) => mapOccasionCard(slug, occasionCounts.get(slug) ?? 0))
    .filter((entry): entry is SearchOccasionCard => entry !== null);
}

export function getSearchResults({
  query,
  scopeFeelingSlug,
  scopeOccasionSlug,
  sortKey,
  priceFilter,
  feelingFilter,
  sizeFilter,
  filterArtist,
  filterOccasion,
  filterColor,
}: ScopedSearchParams): SearchResults {
  const normalizedQuery = normalizeForSearch(query);
  const queryVariants = expandQueryVariants(normalizedQuery);
  const baseProducts = getScopedProducts(scopeFeelingSlug, scopeOccasionSlug);
  const { vibeCounts, occasionCounts } = getScopedCounts(baseProducts);

  const scoredProducts: ScoredProduct[] = baseProducts
    .map((product) => ({ product, score: productScore(product, queryVariants) }))
    .filter((entry) => !normalizedQuery || entry.score > 0);

  const queryMatchedProducts = scoredProducts.map((entry) => entry.product);
  const scoreBySlug = new Map(scoredProducts.map((entry) => [entry.product.slug, entry.score]));

  const vibeFiltered = queryMatchedProducts.filter((product) =>
    feelingFilter !== 'all' ? productFeelingSlug(product) === resolveFeelingSlugParam(feelingFilter) : true,
  );

  let facetFiltered = vibeFiltered;
  if (filterArtist && filterArtist !== 'all') {
    facetFiltered = facetFiltered.filter((p) => p.artistSlug === filterArtist);
  }
  if (filterOccasion && filterOccasion !== 'all') {
    facetFiltered = facetFiltered.filter((p) => p.occasionSlugs.includes(filterOccasion as OccasionSlug));
  }
  if (filterColor && filterColor !== 'all') {
    const target = normalizeForSearch(filterColor);
    facetFiltered = facetFiltered.filter((p) =>
      productGarmentColorLabels(p).some((c) => normalizeForSearch(c) === target),
    );
  }

  const sizeFiltered =
    sizeFilter === 'all' ? facetFiltered : facetFiltered.filter((p) => productHasCatalogSize(p, sizeFilter));

  const filteredProducts = filterByPrice(sizeFiltered, priceFilter);

  const sortedProducts =
    sortKey === 'relevance'
      ? [...filteredProducts].sort((a, b) => {
        if (!normalizedQuery) return catalogIndex(a) - catalogIndex(b);
        const scoreDelta = (scoreBySlug.get(b.slug) ?? 0) - (scoreBySlug.get(a.slug) ?? 0);
        if (scoreDelta !== 0) return scoreDelta;
        return catalogIndex(a) - catalogIndex(b);
      })
      : sortProductList(filteredProducts, sortKey);

  const vibeOptions = [...new Set(queryMatchedProducts.map((product) => productFeelingSlug(product)))]
    .sort((a, b) => optionName(a).localeCompare(optionName(b)))
    .map((slug) => ({ slug, name: optionName(slug) }));

  return {
    baseDesigns: baseProducts.map(mapDesignCard),
    designMatches: sortedProducts.map(mapDesignCard),
    vibeMatches: getMatchedVibes(vibeCounts, queryVariants),
    occasionMatches: getMatchedOccasions(occasionCounts, queryVariants),
    vibeOptions,
    rawDesignMatchCount: queryMatchedProducts.length,
  };
}

export function getSearchSuggestions({
  query,
  scopeOccasionSlug,
  scopeFeelingSlug,
  limitPerGroup = 3,
}: SearchSuggestionsParams): SearchSuggestionGroup[] {
  const results = getSearchResults({
    query,
    scopeOccasionSlug,
    scopeFeelingSlug,
    sortKey: 'relevance',
    priceFilter: 'all',
    feelingFilter: 'all',
    sizeFilter: 'all',
    filterArtist: 'all',
    filterOccasion: 'all',
    filterColor: 'all',
  });

  const groups: SearchSuggestionGroup[] = [];

  const designSuggestions = results.designMatches.slice(0, limitPerGroup).map((product) => ({
    id: `design-${product.slug}`,
    kind: 'design' as const,
    label: product.name,
    meta: product.feelingName ?? 'Design',
    href: `/products/${product.slug}`,
    imageSrc: product.imageSrc,
    imageAlt: product.imageAlt,
    accent: product.feelingAccent,
  }));
  if (designSuggestions.length > 0) {
    groups.push({ kind: 'designs', suggestions: designSuggestions });
  }

  const vibeSuggestions = results.vibeMatches.slice(0, Math.max(2, limitPerGroup - 1)).map((vibe) => ({
    id: `vibe-${vibe.slug}`,
    kind: 'vibe' as const,
    label: vibe.name,
    meta: `${vibe.designCount} design${vibe.designCount === 1 ? '' : 's'}`,
    href: `/feelings/${vibe.slug}`,
    imageSrc: vibe.imageSrc,
    imageAlt: vibe.imageAlt,
    accent: vibe.accent,
  }));
  if (vibeSuggestions.length > 0) {
    groups.push({ kind: 'vibes', suggestions: vibeSuggestions });
  }

  const occasionSuggestions = results.occasionMatches.slice(0, Math.max(2, limitPerGroup - 1)).map((occasion) => ({
    id: `occasion-${occasion.slug}`,
    kind: 'occasion' as const,
    label: occasion.name,
    meta: occasion.priceHint ?? (occasion.isGiftOccasion ? 'Gift-ready' : 'Browse the edit'),
    href: `/occasions/${occasion.slug}`,
    imageSrc: occasion.imageSrc,
    imageAlt: occasion.imageAlt,
  }));
  if (occasionSuggestions.length > 0) {
    groups.push({ kind: 'occasions', suggestions: occasionSuggestions });
  }

  return groups;
}
