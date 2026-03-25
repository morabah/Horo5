import { getOccasionCollectionVisual, getProductMedia, heroStreet, vibeCovers } from '../data/images';
import { getArtist, getOccasion, getVibe, occasions, products, vibes, type OccasionSlug, type Product } from '../data/site';
import { sortProductList, type ProductSortKey } from '../utils/productSort';

export type SearchPriceFilter = 'all' | 'under-800' | '800-899' | '900+';
export type SearchSortKey = 'relevance' | ProductSortKey;
export type SearchSuggestionKind = 'design' | 'vibe' | 'occasion';
export type SearchSuggestionGroupKind = 'designs' | 'vibes' | 'occasions';

export type SearchDesignCard = {
  slug: string;
  name: string;
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
  scopeVibeSlug?: string | null;
  scopeOccasionSlug?: string | null;
  sortKey: SearchSortKey;
  priceFilter: SearchPriceFilter;
  vibeFilter: string;
};

type SearchSuggestionsParams = {
  query: string;
  scopeVibeSlug?: string | null;
  scopeOccasionSlug?: string | null;
  limitPerGroup?: number;
};

type ScoredProduct = {
  product: Product;
  score: number;
};

const VIBE_ALIAS_MAP: Record<string, string[]> = {
  emotions: [
    'emotion',
    'emotional',
    'feelings',
    'feeling',
    'mood',
    'moods',
    'soft thoughtful',
    'soft and thoughtful',
    'مشاعر',
    'احاسيس',
    'أحاسيس',
    'احساس',
    'أحاسيسي',
    'مزاج',
  ],
  zodiac: ['astro', 'astrology', 'sign', 'signs', 'cosmic', 'horoscope', 'ابراج', 'أبراج', 'برج', 'فلك'],
  fiction: [
    'story',
    'stories',
    'fantasy',
    'character',
    'characters',
    'fictional',
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

function catalogIndex(product: Product): number {
  const index = products.findIndex((entry) => entry.slug === product.slug);
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

  for (const [slug, aliases] of Object.entries(VIBE_ALIAS_MAP)) {
    const vibe = getVibe(slug);
    if (!vibe) continue;
    const normalizedAliases = uniqueStrings(aliases);
    if (normalizedAliases.some((alias) => normalizedQuery.includes(alias) || tokens.includes(alias))) {
      variants.add(normalizeForSearch(vibe.name));
      variants.add(normalizeForSearch(slug.replace(/-/g, ' ')));
      variants.add(normalizeForSearch(vibe.tagline));
    }
  }

  for (const [slug, aliases] of Object.entries(OCCASION_ALIAS_MAP) as [OccasionSlug, string[]][]) {
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

function productOccasionNames(product: Product) {
  return product.occasionSlugs
    .map((occasionSlug) => getOccasion(occasionSlug)?.name ?? occasionSlug.replace(/-/g, ' '))
    .join(' ');
}

function productSearchTerms(product: Product) {
  const vibe = getVibe(product.vibeSlug);
  const occasionNames = productOccasionNames(product);
  const aliases = [
    ...(VIBE_ALIAS_MAP[product.vibeSlug] ?? []),
    ...product.occasionSlugs.flatMap((occasionSlug) => OCCASION_ALIAS_MAP[occasionSlug] ?? []),
  ];

  return [product.name, vibe?.name ?? product.vibeSlug, vibe?.tagline ?? '', occasionNames, product.story, '220 GSM cotton graphic tee', ...aliases]
    .filter(Boolean)
    .join(' ');
}

function productScore(product: Product, queryVariants: string[]): number {
  if (queryVariants.length === 0) return 0;
  const artist = getArtist(product.artistSlug);
  const vibe = getVibe(product.vibeSlug);

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
    fieldScore(vibe?.name ?? product.vibeSlug.replace(/-/g, ' '), queryVariants, {
      exact: 72,
      includes: 54,
      token: 12,
      allTokens: 14,
      fuzzy: 8,
    })
  );
}

function vibeScore(vibeSlug: string, queryVariants: string[]): number {
  const vibe = getVibe(vibeSlug);
  if (!vibe || queryVariants.length === 0) return 0;

  return (
    fieldScore(vibe.name, queryVariants, { exact: 120, includes: 88, token: 18, allTokens: 22, fuzzy: 10 }) +
    fieldScore(vibe.tagline, queryVariants, { exact: 36, includes: 26, token: 8, allTokens: 10, fuzzy: 6 }) +
    fieldScore(VIBE_ALIAS_MAP[vibeSlug]?.join(' ') ?? '', queryVariants, {
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
  const vibe = getVibe(product.vibeSlug);
  const media = getProductMedia(product.slug);

  return {
    slug: product.slug,
    name: product.name,
    vibeSlug: product.vibeSlug,
    vibeName: vibe?.name,
    vibeAccent: vibe?.accent,
    priceEgp: product.priceEgp,
    imageSrc: media.main,
    imageAlt: `HORO “${product.name}” graphic tee${vibe ? ` in the ${vibe.name} vibe` : ''}.`,
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
  return getVibe(slug)?.name ?? slug;
}

function getScopedProducts(scopeVibeSlug?: string | null, scopeOccasionSlug?: string | null) {
  let baseProducts = products;
  if (scopeVibeSlug) baseProducts = baseProducts.filter((product) => product.vibeSlug === scopeVibeSlug);
  if (scopeOccasionSlug) baseProducts = baseProducts.filter((product) => product.occasionSlugs.includes(scopeOccasionSlug as OccasionSlug));
  return baseProducts;
}

function getScopedCounts(baseProducts: Product[]) {
  const vibeCounts = new Map<string, number>();
  const occasionCounts = new Map<OccasionSlug, number>();

  for (const product of baseProducts) {
    vibeCounts.set(product.vibeSlug, (vibeCounts.get(product.vibeSlug) ?? 0) + 1);
    for (const occasionSlug of product.occasionSlugs) {
      occasionCounts.set(occasionSlug, (occasionCounts.get(occasionSlug) ?? 0) + 1);
    }
  }

  return { vibeCounts, occasionCounts };
}

function getMatchedVibes(vibeCounts: Map<string, number>, queryVariants: string[]) {
  const matchedVibeSlugs = queryVariants.length
    ? vibes
      .filter((vibe) => vibeCounts.has(vibe.slug))
      .map((vibe) => ({ vibe, score: vibeScore(vibe.slug, queryVariants) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || a.vibe.name.localeCompare(b.vibe.name))
      .map((entry) => entry.vibe.slug)
    : vibes.filter((vibe) => vibeCounts.has(vibe.slug)).map((vibe) => vibe.slug);

  return matchedVibeSlugs
    .map((slug) => mapVibeCard(slug, vibeCounts.get(slug) ?? 0))
    .filter((entry): entry is SearchVibeCard => entry !== null);
}

function getMatchedOccasions(occasionCounts: Map<OccasionSlug, number>, queryVariants: string[]) {
  const matchedOccasionSlugs = queryVariants.length
    ? occasions
      .filter((occasion) => occasionCounts.has(occasion.slug))
      .map((occasion) => ({ occasion, score: occasionScore(occasion.slug, queryVariants) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || a.occasion.name.localeCompare(b.occasion.name))
      .map((entry) => entry.occasion.slug)
    : occasions.filter((occasion) => occasionCounts.has(occasion.slug)).map((occasion) => occasion.slug);

  return matchedOccasionSlugs
    .map((slug) => mapOccasionCard(slug, occasionCounts.get(slug) ?? 0))
    .filter((entry): entry is SearchOccasionCard => entry !== null);
}

export function getSearchResults({
  query,
  scopeVibeSlug,
  scopeOccasionSlug,
  sortKey,
  priceFilter,
  vibeFilter,
}: ScopedSearchParams): SearchResults {
  const normalizedQuery = normalizeForSearch(query);
  const queryVariants = expandQueryVariants(normalizedQuery);
  const baseProducts = getScopedProducts(scopeVibeSlug, scopeOccasionSlug);
  const { vibeCounts, occasionCounts } = getScopedCounts(baseProducts);

  const scoredProducts: ScoredProduct[] = baseProducts
    .map((product) => ({ product, score: productScore(product, queryVariants) }))
    .filter((entry) => !normalizedQuery || entry.score > 0);

  const queryMatchedProducts = scoredProducts.map((entry) => entry.product);
  const scoreBySlug = new Map(scoredProducts.map((entry) => [entry.product.slug, entry.score]));

  const filteredProducts = filterByPrice(
    queryMatchedProducts.filter((product) => (vibeFilter !== 'all' ? product.vibeSlug === vibeFilter : true)),
    priceFilter,
  );

  const sortedProducts =
    sortKey === 'relevance'
      ? [...filteredProducts].sort((a, b) => {
        if (!normalizedQuery) return catalogIndex(a) - catalogIndex(b);
        const scoreDelta = (scoreBySlug.get(b.slug) ?? 0) - (scoreBySlug.get(a.slug) ?? 0);
        if (scoreDelta !== 0) return scoreDelta;
        return catalogIndex(a) - catalogIndex(b);
      })
      : sortProductList(filteredProducts, sortKey);

  const vibeOptions = [...new Set(queryMatchedProducts.map((product) => product.vibeSlug))]
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
  scopeVibeSlug,
  limitPerGroup = 3,
}: SearchSuggestionsParams): SearchSuggestionGroup[] {
  const results = getSearchResults({
    query,
    scopeOccasionSlug,
    scopeVibeSlug,
    sortKey: 'relevance',
    priceFilter: 'all',
    vibeFilter: 'all',
  });

  const groups: SearchSuggestionGroup[] = [];

  const designSuggestions = results.designMatches.slice(0, limitPerGroup).map((product) => ({
    id: `design-${product.slug}`,
    kind: 'design' as const,
    label: product.name,
    meta: product.vibeName ?? 'Design',
    href: `/products/${product.slug}`,
    imageSrc: product.imageSrc,
    imageAlt: product.imageAlt,
    accent: product.vibeAccent,
  }));
  if (designSuggestions.length > 0) {
    groups.push({ kind: 'designs', suggestions: designSuggestions });
  }

  const vibeSuggestions = results.vibeMatches.slice(0, Math.max(2, limitPerGroup - 1)).map((vibe) => ({
    id: `vibe-${vibe.slug}`,
    kind: 'vibe' as const,
    label: vibe.name,
    meta: `${vibe.designCount} design${vibe.designCount === 1 ? '' : 's'}`,
    href: `/vibes/${vibe.slug}`,
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
