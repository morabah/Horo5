/**
 * Result ranking and suggestions use synonym expansion plus Levenshtein-bounded fuzzy
 * token matching in `search/view.ts` (`expandQueryVariants`, `fuzzyTokenScore`), merged
 * with `SEARCH_SYNONYMS_SCHEMA` from `domain-config.ts` and `searchSynonyms.ts`.
 */
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { AppIcon } from '../components/AppIcon';
import { PageBreadcrumb, type PageBreadcrumbItem } from '../components/PageBreadcrumb';
import { MerchProductCard } from '../components/MerchProductCard';
import { ProductQuickView } from '../components/ProductQuickView';
import { SearchSuggestionPanel } from '../components/SearchSuggestionPanel';
import { TeeImageFrame } from '../components/TeeImage';
import { useUiLocale } from '../i18n/ui-locale';
import { SEARCH_SCHEMA } from '../data/domain-config';
import { getFeelingCollectionVisual, getOccasionCollectionVisual, heroStreet, imgUrl } from '../data/images';
import { getFeeling, getOccasion } from '../data/site';
import { trackSearchZeroResults } from '../analytics/events';
import { useMediaQuery } from '../hooks/useMediaQuery';
import {
  getSearchFacetOptions,
  getSearchResults,
  getSearchSuggestions,
  parseSearchSizeFilter,
  type SearchDesignCard,
  type SearchOccasionCard,
  type SearchPriceFilter,
  type SearchSortKey,
  type SearchSuggestion,
  type SearchVibeCard,
} from '../search/view';
import { defaultCatalogSizeKeys } from '../utils/productSizes';

const SEARCH_DEBOUNCE_MS = 250;
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const SORT_IDS: SearchSortKey[] = ['relevance', 'featured', 'newest', 'price-asc', 'price-desc'];
const PRICE_IDS: SearchPriceFilter[] = ['all', 'under-800', '800-899', '900+'];

const SIZE_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: SEARCH_SCHEMA.copy.allSizesLabel },
  ...defaultCatalogSizeKeys().map((size) => ({ value: size, label: size })),
];

const SORT_OPTIONS: { value: SearchSortKey; label: string }[] = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
];

const PRICE_OPTIONS: { value: SearchPriceFilter; label: string }[] = [
  { value: 'all', label: SEARCH_SCHEMA.copy.allPricesLabel },
  { value: 'under-800', label: SEARCH_SCHEMA.copy.under800Label },
  { value: '800-899', label: SEARCH_SCHEMA.copy.between800And899Label },
  { value: '900+', label: SEARCH_SCHEMA.copy.over900Label },
];

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((element) => {
    if (element.hasAttribute('disabled')) return false;
    if (element.getAttribute('aria-hidden') === 'true') return false;
    if (element.tabIndex < 0 && element.tagName !== 'A' && element.tagName !== 'BUTTON') return false;
    return true;
  });
}

function flattenSuggestions(groups: ReturnType<typeof getSearchSuggestions>) {
  return groups.flatMap((group) => group.suggestions);
}

function ChevronIcon() {
  return (
    <span
      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
      style={{ color: 'var(--label-brown)' }}
      aria-hidden
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function formatDesignCount(count: number) {
  return `${count} ${count === 1 ? SEARCH_SCHEMA.copy.designSingular : SEARCH_SCHEMA.copy.designPlural}`;
}

function formatResultCount(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function SearchProductCard({
  product,
  onQuickView,
  onProductClick,
}: {
  product: SearchDesignCard;
  onQuickView: (slug: string) => void;
  onProductClick?: () => void;
}) {
  return (
    <MerchProductCard
      slug={product.slug}
      name={product.name}
      compareAtPriceEgp={product.originalPriceEgp ?? undefined}
      priceEgp={product.priceEgp}
      imageSrc={product.imageSrc}
      imageAlt={product.imageAlt}
      merchandisingBadge={product.merchandisingBadge}
      eyebrow={product.feelingName}
      eyebrowAccent={product.feelingAccent}
      onQuickView={onQuickView}
      onProductClick={onProductClick}
    />
  );
}

function SearchVibeResultCard({ vibe }: { vibe: SearchVibeCard }) {
  return (
    <Link
      to={`/feelings/${vibe.slug}`}
      className="group block overflow-hidden rounded-[18px] border border-stone/70 bg-white/72 text-inherit no-underline shadow-[0_18px_44px_-28px_rgba(26,26,26,0.24)] transition-transform duration-300 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
    >
      <div className="overflow-hidden">
        <TeeImageFrame src={vibe.imageSrc} alt={vibe.imageAlt} w={640} aspectRatio="4/5" borderRadius="0" />
      </div>
      <div className="space-y-2 p-4">
        <p className="font-headline text-lg font-semibold leading-snug text-obsidian">
          <span style={{ color: vibe.accent }}>●</span> {vibe.name}
        </p>
        <p className="font-body text-sm leading-relaxed text-warm-charcoal">{vibe.tagline}</p>
        <p className="font-label text-[10px] font-medium uppercase tracking-[0.18em] text-label">{formatDesignCount(vibe.designCount)}</p>
        <span className="font-label inline-flex min-h-11 items-center text-[10px] font-medium uppercase tracking-[0.18em] text-deep-teal">
          {SEARCH_SCHEMA.copy.viewVibeCta}
        </span>
      </div>
    </Link>
  );
}

function SearchOccasionResultCard({ occasion }: { occasion: SearchOccasionCard }) {
  return (
    <Link
      to={`/occasions/${occasion.slug}`}
      className="group block overflow-hidden rounded-[18px] border border-stone/70 bg-white/72 text-inherit no-underline shadow-[0_18px_44px_-28px_rgba(26,26,26,0.24)] transition-transform duration-300 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
    >
      <div className="overflow-hidden">
        <TeeImageFrame src={occasion.imageSrc} alt={occasion.imageAlt} w={640} aspectRatio="4/5" borderRadius="0" />
      </div>
      <div className="space-y-2 p-4">
        <p className="font-headline text-lg font-semibold leading-snug text-obsidian">{occasion.name}</p>
        <p className="font-body text-sm leading-relaxed text-warm-charcoal">{occasion.blurb}</p>
        <div className="flex flex-wrap gap-2">
          {occasion.priceHint ? (
            <span className="font-label inline-flex min-h-9 items-center rounded-full border border-stone bg-white px-3 py-2 text-[10px] font-medium uppercase tracking-[0.18em] text-clay-earth shadow-sm">
              {occasion.priceHint}
            </span>
          ) : null}
          {occasion.isGiftOccasion ? (
            <span className="font-label inline-flex min-h-9 items-center rounded-full border border-stone bg-white px-3 py-2 text-[10px] font-medium uppercase tracking-[0.18em] text-clay-earth shadow-sm">
              Gift-ready
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export function Search() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const { copy } = useUiLocale();
  const searchRootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileFilterSheetRef = useRef<HTMLDivElement>(null);
  const mobileFilterCloseBtnRef = useRef<HTMLButtonElement>(null);
  const mobileFilterTriggerRef = useRef<HTMLElement | null>(null);

  const urlQuery = params.get('q') ?? '';
  const [q, setQ] = useState(urlQuery);
  const [debouncedQ, setDebouncedQ] = useState(urlQuery);
  const [quickViewSlug, setQuickViewSlug] = useState<string | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

  const sortKey = SORT_IDS.includes((params.get('sort') ?? '') as SearchSortKey) ? (params.get('sort') as SearchSortKey) : 'relevance';
  const priceFilter = PRICE_IDS.includes((params.get('price') ?? '') as SearchPriceFilter)
    ? (params.get('price') as SearchPriceFilter)
    : 'all';
  const feelingFilter = params.get('feelingFilter') ?? params.get('vibeFilter') ?? 'all';
  const sizeFilter = parseSearchSizeFilter(params.get('size'));

  const scopeFeeling = useMemo(() => {
    const value = (params.get('feeling') ?? params.get('vibe') ?? '').trim();
    return value ? getFeeling(value) ?? null : null;
  }, [params]);

  const scopeOccasion = useMemo(() => {
    const value = params.get('occasion') ?? '';
    return value.trim() ? getOccasion(value) ?? null : null;
  }, [params]);

  const facetOptions = useMemo(
    () => getSearchFacetOptions(scopeFeeling?.slug ?? null, scopeOccasion?.slug ?? null),
    [scopeOccasion?.slug, scopeFeeling?.slug],
  );

  const rawFilterArtist = params.get('fArtist') ?? 'all';
  const filterArtist = facetOptions.artistOptions.some((o) => o.slug === rawFilterArtist) ? rawFilterArtist : 'all';

  const rawFilterOccasion = params.get('fOccasion') ?? 'all';
  const filterOccasion = facetOptions.occasionOptions.some((o) => o.slug === rawFilterOccasion) ? rawFilterOccasion : 'all';

  const rawFilterColor = params.get('fColor') ?? 'all';
  const filterColor = facetOptions.colorOptions.includes(rawFilterColor) ? rawFilterColor : 'all';

  useEffect(() => {
    setQ(urlQuery);
    setDebouncedQ(urlQuery);
    setSearchFocused(false);
    setActiveSuggestionIndex(-1);
  }, [urlQuery]);

  useEffect(() => {
    const legacyArtistTab = params.get('tab') === 'artists';
    if (!params.has('artist') && !params.has('tab') && !legacyArtistTab) return;
    const next = new URLSearchParams(params);
    next.delete('artist');
    next.delete('tab');
    setParams(next, { replace: true });
  }, [params, setParams]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQ(q);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timeoutId);
  }, [q]);

  useEffect(() => {
    if (params.get('focus') !== '1') return;
    inputRef.current?.focus();
    const next = new URLSearchParams(params);
    next.delete('focus');
    setParams(next, { replace: true });
  }, [params, setParams]);

  useEffect(() => {
    const nextQuery = debouncedQ.trim();
    if (urlQuery === nextQuery) return;
    const next = new URLSearchParams(params);
    if (nextQuery) next.set('q', nextQuery);
    else next.delete('q');
    next.delete('focus');
    setParams(next, { replace: true });
  }, [debouncedQ, params, setParams, urlQuery]);

  useEffect(() => {
    if (!isMobile) {
      setMobileFiltersOpen(false);
    }
  }, [isMobile]);

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(params);
      for (const [key, rawValue] of Object.entries(updates)) {
        const value = rawValue?.trim();
        if (
          value == null ||
          value === '' ||
          (key === 'sort' && value === 'relevance') ||
          (key === 'price' && value === 'all') ||
          (key === 'feelingFilter' && value === 'all') ||
          (key === 'vibeFilter' && value === 'all') ||
          (key === 'size' && value === 'all') ||
          (key === 'fArtist' && value === 'all') ||
          (key === 'fOccasion' && value === 'all') ||
          (key === 'fColor' && value === 'all')
        ) {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      }
      next.delete('focus');
      setParams(next, { replace: true });
    },
    [params, setParams],
  );

  const closeMobileFilters = useCallback(() => {
    setMobileFiltersOpen(false);
  }, []);

  const openMobileFilters = useCallback(() => {
    mobileFilterTriggerRef.current = document.activeElement as HTMLElement | null;
    setMobileFiltersOpen(true);
  }, []);

  useEffect(() => {
    if (!mobileFiltersOpen) {
      const trigger = mobileFilterTriggerRef.current;
      mobileFilterTriggerRef.current = null;
      trigger?.focus();
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMobileFilters();
    };
    window.addEventListener('keydown', onKeyDown);
    const frameId = requestAnimationFrame(() => {
      mobileFilterCloseBtnRef.current?.focus();
    });

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      cancelAnimationFrame(frameId);
    };
  }, [mobileFiltersOpen, closeMobileFilters]);

  useEffect(() => {
    if (!mobileFiltersOpen) return;
    const panel = mobileFilterSheetRef.current;
    if (!panel) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const nodes = getFocusableElements(panel);
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (active === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    panel.addEventListener('keydown', onKeyDown);
    return () => panel.removeEventListener('keydown', onKeyDown);
  }, [mobileFiltersOpen]);

  useEffect(() => {
    if (!searchFocused) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (target && searchRootRef.current?.contains(target)) return;
      setSearchFocused(false);
      setActiveSuggestionIndex(-1);
    };
    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [searchFocused]);

  const searchResults = useMemo(
    () =>
      getSearchResults({
        query: debouncedQ,
        scopeOccasionSlug: scopeOccasion?.slug,
        scopeFeelingSlug: scopeFeeling?.slug,
        sortKey,
        priceFilter,
        feelingFilter,
        sizeFilter,
        filterArtist,
        filterOccasion,
        filterColor,
      }),
    [
      debouncedQ,
      filterArtist,
      filterColor,
      filterOccasion,
      priceFilter,
      scopeOccasion?.slug,
      scopeFeeling?.slug,
      sortKey,
      feelingFilter,
      sizeFilter,
    ],
  );

  const suggestionGroups = useMemo(
    () =>
      getSearchSuggestions({
        query: q,
        scopeOccasionSlug: scopeOccasion?.slug,
        scopeFeelingSlug: scopeFeeling?.slug,
        limitPerGroup: 3,
      }),
    [q, scopeOccasion?.slug, scopeFeeling?.slug],
  );
  const flatSuggestions = useMemo(() => flattenSuggestions(suggestionGroups), [suggestionGroups]);
  const suggestionsOpen = searchFocused && (suggestionGroups.length > 0 || q.trim().length > 0);
  const activeSuggestion = activeSuggestionIndex >= 0 ? flatSuggestions[activeSuggestionIndex] : null;
  const activeSuggestionId = activeSuggestion ? `search-page-suggestions-${activeSuggestionIndex}` : undefined;

  useEffect(() => {
    setActiveSuggestionIndex(-1);
  }, [q, suggestionGroups.length]);

  const { baseDesigns, designMatches, vibeMatches, occasionMatches, vibeOptions } = searchResults;
  const totalResults = designMatches.length + vibeMatches.length + occasionMatches.length;
  const inputEmpty = q.trim().length === 0;
  const hasDebouncedQuery = debouncedQ.trim().length > 0;
  const hasActiveFilters =
    sortKey !== 'relevance' ||
    priceFilter !== 'all' ||
    feelingFilter !== 'all' ||
    sizeFilter !== 'all' ||
    filterArtist !== 'all' ||
    filterOccasion !== 'all' ||
    filterColor !== 'all';
  const noResultsAcrossSections = hasDebouncedQuery && totalResults === 0;

  const scopeLabels = [scopeOccasion?.name, scopeFeeling?.name].filter(Boolean);
  const scopeSummary = scopeLabels.join(' · ');

  const clearScopeTo = useMemo(() => {
    const next = new URLSearchParams(params);
    next.delete('feeling');
    next.delete('vibe');
    next.delete('occasion');
    next.delete('focus');
    const queryString = next.toString();
    return queryString ? `/search?${queryString}` : '/search';
  }, [params]);

  const leadVisual = useMemo(() => {
    if (scopeOccasion) {
      const visual = getOccasionCollectionVisual(scopeOccasion.slug).hero;
      return { src: visual.src, alt: visual.alt };
    }
    if (scopeFeeling) {
      const visual = getFeelingCollectionVisual(scopeFeeling.slug).cover;
      return { src: visual.src, alt: visual.alt };
    }
    if (designMatches[0]) return { src: designMatches[0].imageSrc, alt: designMatches[0].imageAlt };
    if (baseDesigns[0]) return { src: baseDesigns[0].imageSrc, alt: baseDesigns[0].imageAlt };
    return { src: heroStreet, alt: 'HORO search — editorial styling in a graphic tee.' };
  }, [baseDesigns, designMatches, scopeOccasion, scopeFeeling]);

  const summaryText = hasDebouncedQuery
    ? SEARCH_SCHEMA.copy.resultsForQuery.replace('{count}', String(totalResults)).replace('{query}', debouncedQ.trim())
    : scopeSummary
      ? SEARCH_SCHEMA.copy.scopedResultsFallback.replace('{scope}', scopeSummary)
      : SEARCH_SCHEMA.copy.resultsFallback;

  const popularSearches = useMemo(() => {
    const suggestions = [
      ...(scopeOccasion ? [scopeOccasion.name] : []),
      ...(scopeFeeling ? [scopeFeeling.name] : []),
      ...baseDesigns.slice(0, 4).map((design) => design.name),
      ...vibeMatches.slice(0, 2).map((vibe) => vibe.name),
      ...occasionMatches.slice(0, 2).map((occasion) => occasion.name),
      'Gift Something Real',
      'Midnight Compass',
    ];
    return [...new Set(suggestions)].slice(0, 6);
  }, [baseDesigns, occasionMatches, scopeOccasion, scopeFeeling, vibeMatches]);

  const resetFilters = useCallback(() => {
    updateParams({
      sort: 'relevance',
      price: 'all',
      feelingFilter: 'all',
      vibeFilter: null,
      size: 'all',
      fArtist: 'all',
      fOccasion: 'all',
      fColor: 'all',
    });
  }, [updateParams]);

  const buildSearchWithQuery = useCallback(
    (term: string) => {
      const next = new URLSearchParams(params);
      next.set('q', term);
      next.delete('focus');
      const qs = next.toString();
      return qs ? `/search?${qs}` : '/search';
    },
    [params],
  );

  useEffect(() => {
    if (!noResultsAcrossSections) return;
    trackSearchZeroResults({
      search_term: debouncedQ.trim(),
      sort: sortKey,
      price: priceFilter,
      vibe_filter: feelingFilter,
      size: sizeFilter,
      filter_artist: filterArtist,
      filter_occasion: filterOccasion,
      filter_color: filterColor,
      ...(scopeFeeling ? { scope_feeling: scopeFeeling.slug } : {}),
      ...(scopeOccasion ? { scope_occasion: scopeOccasion.slug } : {}),
    });
  }, [
    debouncedQ,
    filterArtist,
    filterColor,
    filterOccasion,
    noResultsAcrossSections,
    priceFilter,
    scopeOccasion,
    scopeFeeling,
    sizeFilter,
    sortKey,
    feelingFilter,
  ]);

  const breadcrumbItems = useMemo((): PageBreadcrumbItem[] => {
    const items: PageBreadcrumbItem[] = [{ label: copy.shell.home, to: '/' }];
    if (scopeFeeling) {
      items.push({ label: scopeFeeling.name, to: `/feelings/${scopeFeeling.slug}` });
    } else if (scopeOccasion) {
      items.push({ label: scopeOccasion.name, to: `/occasions/${scopeOccasion.slug}` });
    }
    items.push({ label: copy.shell.search });
    return items;
  }, [copy.shell.home, copy.shell.search, scopeOccasion, scopeFeeling]);

  function handleSuggestionSelect(suggestion: SearchSuggestion) {
    navigate(suggestion.href);
    setSearchFocused(false);
    setActiveSuggestionIndex(-1);
  }

  function handleInputKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!flatSuggestions.length) return;
      setActiveSuggestionIndex((current) => (current + 1 >= flatSuggestions.length ? 0 : current + 1));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!flatSuggestions.length) return;
      setActiveSuggestionIndex((current) => (current <= 0 ? flatSuggestions.length - 1 : current - 1));
      return;
    }
    if (event.key === 'Escape') {
      setSearchFocused(false);
      setActiveSuggestionIndex(-1);
      event.currentTarget.blur();
    }
    if (event.key === 'Enter' && activeSuggestion) {
      event.preventDefault();
      handleSuggestionSelect(activeSuggestion);
    }
  }

  return (
    <div className="bg-papyrus pb-16 md:pb-20">
      <a
        href="#search-results-panel"
        className="sr-only left-4 top-[max(0.75rem,env(safe-area-inset-top))] z-250 rounded-sm border border-outline-variant/50 bg-papyrus px-4 py-3 font-label text-[11px] font-semibold uppercase tracking-widest text-obsidian shadow-md outline-none ring-deep-teal focus:not-sr-only focus:fixed focus:ring-2"
      >
        Skip to results
      </a>

      <div className="mx-auto min-h-[calc(100vh-10rem)] max-w-7xl px-6 pt-8 pb-12 md:px-10 md:pt-10 md:pb-16">
        <PageBreadcrumb className="mb-6" items={breadcrumbItems} />
        <section className="grid gap-6 lg:grid-cols-[minmax(0,33rem)_minmax(0,1fr)] lg:items-stretch">
          <div className="card-glass border border-white/60 bg-[linear-gradient(145deg,rgba(255,255,255,0.84),rgba(248,246,242,0.72))] p-5 shadow-[0_28px_60px_-36px_rgba(26,26,26,0.35)] md:p-7">
            <div className="flex flex-col gap-5">
              {scopeSummary ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-label text-[10px] font-medium uppercase tracking-[0.22em] text-label">
                    {SEARCH_SCHEMA.copy.searchingInLabel}
                  </span>
                  {scopeLabels.map((label) => (
                    <span
                      key={label}
                      className="font-label inline-flex min-h-11 items-center rounded-full border border-stone bg-white/82 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.18em] text-obsidian shadow-sm"
                    >
                      {label}
                    </span>
                  ))}
                  <Link
                    to={clearScopeTo}
                    className="font-label inline-flex min-h-12 items-center text-[10px] font-medium uppercase tracking-[0.18em] text-deep-teal"
                  >
                    {SEARCH_SCHEMA.copy.searchAllLabel}
                  </Link>
                </div>
              ) : null}

              <div ref={searchRootRef} className="relative">
                <label htmlFor="search-page-input" className="sr-only">
                  {SEARCH_SCHEMA.copy.searchLabel}
                </label>
                <span className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-obsidian/62" aria-hidden>
                  <AppIcon name="search" className="h-5 w-5" />
                </span>
                <input
                  ref={inputRef}
                  id="search-page-input"
                  type="search"
                  value={q}
                  onChange={(event) => setQ(event.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onKeyDown={handleInputKeyDown}
                  placeholder={copy.nav.searchPlaceholder}
                  className="font-body min-h-14 w-full rounded-sm border border-stone/80 bg-white/92 px-4 pl-12 pr-14 text-base text-obsidian shadow-sm placeholder:text-clay/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                  autoComplete="off"
                  aria-expanded={suggestionsOpen}
                  aria-controls="search-page-suggestions"
                  aria-activedescendant={activeSuggestionId}
                  role="combobox"
                />
                {q.trim() ? (
                  <button
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      setQ('');
                      setDebouncedQ('');
                      setActiveSuggestionIndex(-1);
                    }}
                    className="absolute right-2 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full text-obsidian/72 transition-colors hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                    aria-label={copy.nav.searchClear}
                  >
                    <AppIcon name="close" className="h-5 w-5" />
                  </button>
                ) : null}

                {suggestionsOpen ? (
                  <div className="absolute inset-x-0 top-[calc(100%+0.75rem)] z-30">
                    <SearchSuggestionPanel
                      groups={suggestionGroups}
                      activeIndex={activeSuggestionIndex}
                      listboxId="search-page-suggestions"
                      onHover={setActiveSuggestionIndex}
                      onSelect={handleSuggestionSelect}
                    />
                  </div>
                ) : null}
              </div>

              <p className="font-body text-sm leading-relaxed text-warm-charcoal md:text-[0.98rem]">{summaryText}</p>

              {inputEmpty ? (
                <div className="flex flex-wrap gap-2">
                  <span className="font-label basis-full text-[10px] font-medium uppercase tracking-[0.22em] text-label">
                    {SEARCH_SCHEMA.copy.popularLabel}
                  </span>
                  {popularSearches.map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => {
                        setQ(label);
                        setDebouncedQ(label);
                      }}
                      className="font-label inline-flex min-h-12 items-center rounded-full border border-stone bg-white/88 px-4 py-3 text-[10px] font-medium uppercase tracking-[0.18em] text-obsidian shadow-sm transition-colors hover:border-desert-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.25rem] border border-stone/70 bg-white/60 shadow-[0_30px_60px_-36px_rgba(26,26,26,0.35)]">
            <img
              src={imgUrl(leadVisual.src, 1400)}
              alt={leadVisual.alt}
              className="block h-full min-h-[20rem] w-full object-cover object-center md:min-h-[26rem]"
              width={1400}
              height={1750}
              decoding="async"
            />
          </div>
        </section>

        <section id="search-results-panel" className="mt-10 scroll-mt-[calc(8rem+env(safe-area-inset-top,0px))] md:mt-12">
          {isMobile ? (
            <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-stone/30 pb-4">
              <button
                type="button"
                onClick={openMobileFilters}
                className="font-label inline-flex min-h-12 items-center justify-center rounded-sm border border-stone bg-white px-5 py-3 text-[11px] font-medium uppercase tracking-[0.2em] text-obsidian shadow-sm transition-colors hover:border-desert-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
              >
                {SEARCH_SCHEMA.copy.filterAndSortCta}
              </button>
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="font-label inline-flex min-h-12 items-center text-[11px] font-medium uppercase tracking-[0.2em] text-deep-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                >
                  {SEARCH_SCHEMA.copy.resetFiltersCta}
                </button>
              ) : null}
            </div>
          ) : (
            <div className="sticky top-[calc(7.5rem+env(safe-area-inset-top,0px))] z-20 mb-8 flex items-end justify-between gap-6 border-b border-stone/30 bg-papyrus/95 pb-4 backdrop-blur-sm">
              <div className="flex min-w-0 flex-wrap items-end gap-4">
                <div className="flex min-w-[13rem] flex-col gap-2">
                  <label htmlFor="search-sort" className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-label">
                    {SEARCH_SCHEMA.copy.sortLabel}
                  </label>
                  <div className="relative">
                    <select
                      id="search-sort"
                      value={sortKey}
                      onChange={(event) => updateParams({ sort: event.target.value })}
                      className="min-h-12 w-full appearance-none rounded-sm border border-stone bg-white py-0 pl-4 pr-10 text-sm text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                    >
                      {SORT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronIcon />
                  </div>
                </div>

                <div className="flex min-w-[13rem] flex-col gap-2">
                  <label htmlFor="search-price" className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-label">
                    {SEARCH_SCHEMA.copy.priceLabel}
                  </label>
                  <div className="relative">
                    <select
                      id="search-price"
                      value={priceFilter}
                      onChange={(event) => updateParams({ price: event.target.value })}
                      className="min-h-12 w-full appearance-none rounded-sm border border-stone bg-white py-0 pl-4 pr-10 text-sm text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                    >
                      {PRICE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronIcon />
                  </div>
                </div>

                {vibeOptions.length > 1 ? (
                  <div className="flex min-w-[13rem] flex-col gap-2">
                    <label htmlFor="search-vibe" className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-label">
                      {SEARCH_SCHEMA.copy.vibeLabel}
                    </label>
                    <div className="relative">
                      <select
                        id="search-vibe"
                        value={feelingFilter}
                        onChange={(event) => updateParams({ feelingFilter: event.target.value, vibeFilter: null })}
                        className="min-h-12 w-full appearance-none rounded-sm border border-stone bg-white py-0 pl-4 pr-10 text-sm text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                      >
                        <option value="all">{SEARCH_SCHEMA.copy.allVibesLabel}</option>
                        {vibeOptions.map((option) => (
                          <option key={option.slug} value={option.slug}>
                            {option.name}
                          </option>
                        ))}
                      </select>
                      <ChevronIcon />
                    </div>
                  </div>
                ) : null}

                <div className="flex min-w-[13rem] flex-col gap-2">
                  <label htmlFor="search-size" className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-label">
                    {SEARCH_SCHEMA.copy.sizeFilterLabel}
                  </label>
                  <div className="relative">
                    <select
                      id="search-size"
                      value={sizeFilter}
                      onChange={(event) => updateParams({ size: event.target.value })}
                      className="min-h-12 w-full appearance-none rounded-sm border border-stone bg-white py-0 pl-4 pr-10 text-sm text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                    >
                      {SIZE_FILTER_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronIcon />
                  </div>
                </div>

                {facetOptions.artistOptions.length > 1 ? (
                  <div className="flex min-w-[13rem] flex-col gap-2">
                    <label htmlFor="search-artist" className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-label">
                      {SEARCH_SCHEMA.copy.artistLabel}
                    </label>
                    <div className="relative">
                      <select
                        id="search-artist"
                        value={filterArtist}
                        onChange={(event) => updateParams({ fArtist: event.target.value })}
                        className="min-h-12 w-full appearance-none rounded-sm border border-stone bg-white py-0 pl-4 pr-10 text-sm text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                      >
                        <option value="all">{SEARCH_SCHEMA.copy.allArtistsLabel}</option>
                        {facetOptions.artistOptions.map((option) => (
                          <option key={option.slug} value={option.slug}>
                            {option.name}
                          </option>
                        ))}
                      </select>
                      <ChevronIcon />
                    </div>
                  </div>
                ) : null}

                {facetOptions.occasionOptions.length > 1 ? (
                  <div className="flex min-w-[13rem] flex-col gap-2">
                    <label htmlFor="search-occasion-facet" className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-label">
                      {SEARCH_SCHEMA.copy.occasionFilterLabel}
                    </label>
                    <div className="relative">
                      <select
                        id="search-occasion-facet"
                        value={filterOccasion}
                        onChange={(event) => updateParams({ fOccasion: event.target.value })}
                        className="min-h-12 w-full appearance-none rounded-sm border border-stone bg-white py-0 pl-4 pr-10 text-sm text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                      >
                        <option value="all">{SEARCH_SCHEMA.copy.allOccasionsFilterLabel}</option>
                        {facetOptions.occasionOptions.map((option) => (
                          <option key={option.slug} value={option.slug}>
                            {option.name}
                          </option>
                        ))}
                      </select>
                      <ChevronIcon />
                    </div>
                  </div>
                ) : null}

                {facetOptions.colorOptions.length > 1 ? (
                  <div className="flex min-w-[13rem] flex-col gap-2">
                    <label htmlFor="search-color" className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-label">
                      {SEARCH_SCHEMA.copy.colorLabel}
                    </label>
                    <div className="relative">
                      <select
                        id="search-color"
                        value={filterColor}
                        onChange={(event) => updateParams({ fColor: event.target.value })}
                        className="min-h-12 w-full appearance-none rounded-sm border border-stone bg-white py-0 pl-4 pr-10 text-sm text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                      >
                        <option value="all">{SEARCH_SCHEMA.copy.allColorsLabel}</option>
                        {facetOptions.colorOptions.map((color) => (
                          <option key={color} value={color}>
                            {color}
                          </option>
                        ))}
                      </select>
                      <ChevronIcon />
                    </div>
                  </div>
                ) : null}
              </div>

              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="font-label inline-flex min-h-12 shrink-0 items-center text-[11px] font-medium uppercase tracking-[0.2em] text-deep-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                >
                  {SEARCH_SCHEMA.copy.resetFiltersCta}
                </button>
              ) : null}
            </div>
          )}

          {noResultsAcrossSections ? (
            <div className="card-glass mt-4 flex flex-col items-center border border-stone/70 px-6 py-10 text-center md:py-12">
              <h2 className="font-headline text-[1.45rem] font-semibold tracking-tight text-obsidian">
                {SEARCH_SCHEMA.copy.noResultsForQuery.replace('{query}', debouncedQ.trim())}
              </h2>
              <p className="mt-3 max-w-xl font-body text-[0.98rem] leading-relaxed text-warm-charcoal">
                Try a shorter phrase, clear filters, or browse by feeling and occasion.
              </p>
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="font-label mt-4 min-h-12 rounded-sm border border-obsidian px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-obsidian transition-colors hover:bg-obsidian hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                >
                  {SEARCH_SCHEMA.copy.resetFiltersCta}
                </button>
              ) : null}
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
                <Link className="btn btn-primary" to="/feelings">
                  {SEARCH_SCHEMA.copy.shopByVibeCta}
                </Link>
                <Link className="btn btn-secondary text-sm" to="/occasions">
                  {SEARCH_SCHEMA.copy.shopByOccasionCta}
                </Link>
                <Link className="btn btn-ghost" to="/search">
                  {SEARCH_SCHEMA.copy.browseAllDesignsCta}
                </Link>
              </div>
              <p className="mt-8 font-label text-[10px] font-medium uppercase tracking-[0.22em] text-label">
                {SEARCH_SCHEMA.copy.zeroResultsSuggestionsHeading}
              </p>
              <div className="mt-3 flex max-w-xl flex-wrap justify-center gap-2">
                {popularSearches.map((term) => (
                  <Link
                    key={term}
                    to={buildSearchWithQuery(term)}
                    className="font-body inline-flex min-h-11 items-center rounded-full border border-stone/80 bg-white/90 px-4 py-2 text-sm text-obsidian transition-colors hover:border-deep-teal hover:text-deep-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                  >
                    {term}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {!noResultsAcrossSections ? (
            <div className="space-y-12">
              <section aria-labelledby="search-designs-heading">
                <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="font-label text-[10px] font-medium uppercase tracking-[0.22em] text-label">{copy.search.designsCount}</p>
                    <h2 id="search-designs-heading" className="font-headline mt-2 text-[1.55rem] font-semibold tracking-tight text-obsidian">
                      {copy.search.designsHeading}
                    </h2>
                  </div>
                  <p className="font-body text-sm text-clay">{formatDesignCount(designMatches.length)}</p>
                </div>

                <div className="vibe-product-grid">
                  {designMatches.map((product) => (
                    <SearchProductCard
                      key={product.slug}
                      product={product}
                      onQuickView={setQuickViewSlug}
                    />
                  ))}
                </div>

                {designMatches.length === 0 ? (
                  <div className="mt-6">
                    <p className="font-body text-clay">
                      {hasActiveFilters ? SEARCH_SCHEMA.copy.noFilteredResults : SEARCH_SCHEMA.copy.noDesignResults}{' '}
                      {hasActiveFilters ? (
                        <button type="button" onClick={resetFilters} className="border-0 bg-transparent font-medium text-deep-teal underline">
                          {SEARCH_SCHEMA.copy.resetFiltersCta}
                        </button>
                      ) : null}
                    </p>
                  </div>
                ) : null}
              </section>

              {vibeMatches.length > 0 ? (
                <section aria-labelledby="search-vibes-heading">
                  <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p className="font-label text-[10px] font-medium uppercase tracking-[0.22em] text-label">{copy.search.relatedVibesHeading}</p>
                      <h2 id="search-vibes-heading" className="font-headline mt-2 text-[1.55rem] font-semibold tracking-tight text-obsidian">
                        {copy.search.vibesHeading}
                      </h2>
                    </div>
                    <p className="font-body text-sm text-clay">{formatResultCount(vibeMatches.length, 'feeling', 'feelings')}</p>
                  </div>
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {vibeMatches.map((vibe) => (
                      <SearchVibeResultCard key={vibe.slug} vibe={vibe} />
                    ))}
                  </div>
                </section>
              ) : null}

              {occasionMatches.length > 0 ? (
                <section aria-labelledby="search-occasions-heading">
                  <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p className="font-label text-[10px] font-medium uppercase tracking-[0.22em] text-label">{copy.search.relatedOccasionsHeading}</p>
                      <h2 id="search-occasions-heading" className="font-headline mt-2 text-[1.55rem] font-semibold tracking-tight text-obsidian">
                        {copy.search.occasionsHeading}
                      </h2>
                    </div>
                    <p className="font-body text-sm text-clay">{formatResultCount(occasionMatches.length, 'occasion', 'occasions')}</p>
                  </div>
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {occasionMatches.map((occasion) => (
                      <SearchOccasionResultCard key={occasion.slug} occasion={occasion} />
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>

      {isMobile && mobileFiltersOpen && typeof document !== 'undefined'
        ? createPortal(
          <div className="fixed inset-0 z-[240] bg-black/55 backdrop-blur-sm" onClick={closeMobileFilters}>
            <div
              ref={mobileFilterSheetRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="mobile-search-filters-title"
              className="absolute inset-x-0 bottom-0 rounded-t-[1.5rem] bg-papyrus px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-5 shadow-[0_-24px_64px_-24px_rgba(0,0,0,0.38)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-label text-[10px] font-medium uppercase tracking-[0.24em] text-label">{copy.search.designsHeading}</p>
                  <h2 id="mobile-search-filters-title" className="font-headline mt-2 text-2xl font-semibold tracking-tight text-obsidian">
                    {SEARCH_SCHEMA.copy.filterAndSortCta}
                  </h2>
                </div>
                <button
                  ref={mobileFilterCloseBtnRef}
                  type="button"
                  onClick={closeMobileFilters}
                  className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-full border border-stone bg-white text-obsidian shadow-sm transition-colors hover:border-desert-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                  aria-label="Close filters"
                >
                  <AppIcon name="close" className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="mobile-search-sort" className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-label">
                    {SEARCH_SCHEMA.copy.sortLabel}
                  </label>
                  <div className="relative">
                    <select
                      id="mobile-search-sort"
                      value={sortKey}
                      onChange={(event) => updateParams({ sort: event.target.value })}
                      className="min-h-12 w-full appearance-none rounded-sm border border-stone bg-white py-0 pl-4 pr-10 text-sm text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                    >
                      {SORT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronIcon />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="mobile-search-price" className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-label">
                    {SEARCH_SCHEMA.copy.priceLabel}
                  </label>
                  <div className="relative">
                    <select
                      id="mobile-search-price"
                      value={priceFilter}
                      onChange={(event) => updateParams({ price: event.target.value })}
                      className="min-h-12 w-full appearance-none rounded-sm border border-stone bg-white py-0 pl-4 pr-10 text-sm text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                    >
                      {PRICE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronIcon />
                  </div>
                </div>

                {vibeOptions.length > 1 ? (
                  <div className="flex flex-col gap-2">
                    <label htmlFor="mobile-search-vibe" className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-label">
                      {SEARCH_SCHEMA.copy.vibeLabel}
                    </label>
                    <div className="relative">
                      <select
                        id="mobile-search-vibe"
                        value={feelingFilter}
                        onChange={(event) => updateParams({ feelingFilter: event.target.value, vibeFilter: null })}
                        className="min-h-12 w-full appearance-none rounded-sm border border-stone bg-white py-0 pl-4 pr-10 text-sm text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                      >
                        <option value="all">{SEARCH_SCHEMA.copy.allVibesLabel}</option>
                        {vibeOptions.map((option) => (
                          <option key={option.slug} value={option.slug}>
                            {option.name}
                          </option>
                        ))}
                      </select>
                      <ChevronIcon />
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-col gap-2">
                  <label htmlFor="mobile-search-size" className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-label">
                    {SEARCH_SCHEMA.copy.sizeFilterLabel}
                  </label>
                  <div className="relative">
                    <select
                      id="mobile-search-size"
                      value={sizeFilter}
                      onChange={(event) => updateParams({ size: event.target.value })}
                      className="min-h-12 w-full appearance-none rounded-sm border border-stone bg-white py-0 pl-4 pr-10 text-sm text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                    >
                      {SIZE_FILTER_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronIcon />
                  </div>
                </div>

                {facetOptions.artistOptions.length > 1 ? (
                  <div className="flex flex-col gap-2">
                    <label htmlFor="mobile-search-artist" className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-label">
                      {SEARCH_SCHEMA.copy.artistLabel}
                    </label>
                    <div className="relative">
                      <select
                        id="mobile-search-artist"
                        value={filterArtist}
                        onChange={(event) => updateParams({ fArtist: event.target.value })}
                        className="min-h-12 w-full appearance-none rounded-sm border border-stone bg-white py-0 pl-4 pr-10 text-sm text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                      >
                        <option value="all">{SEARCH_SCHEMA.copy.allArtistsLabel}</option>
                        {facetOptions.artistOptions.map((option) => (
                          <option key={option.slug} value={option.slug}>
                            {option.name}
                          </option>
                        ))}
                      </select>
                      <ChevronIcon />
                    </div>
                  </div>
                ) : null}

                {facetOptions.occasionOptions.length > 1 ? (
                  <div className="flex flex-col gap-2">
                    <label htmlFor="mobile-search-occasion-facet" className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-label">
                      {SEARCH_SCHEMA.copy.occasionFilterLabel}
                    </label>
                    <div className="relative">
                      <select
                        id="mobile-search-occasion-facet"
                        value={filterOccasion}
                        onChange={(event) => updateParams({ fOccasion: event.target.value })}
                        className="min-h-12 w-full appearance-none rounded-sm border border-stone bg-white py-0 pl-4 pr-10 text-sm text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                      >
                        <option value="all">{SEARCH_SCHEMA.copy.allOccasionsFilterLabel}</option>
                        {facetOptions.occasionOptions.map((option) => (
                          <option key={option.slug} value={option.slug}>
                            {option.name}
                          </option>
                        ))}
                      </select>
                      <ChevronIcon />
                    </div>
                  </div>
                ) : null}

                {facetOptions.colorOptions.length > 1 ? (
                  <div className="flex flex-col gap-2">
                    <label htmlFor="mobile-search-color" className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-label">
                      {SEARCH_SCHEMA.copy.colorLabel}
                    </label>
                    <div className="relative">
                      <select
                        id="mobile-search-color"
                        value={filterColor}
                        onChange={(event) => updateParams({ fColor: event.target.value })}
                        className="min-h-12 w-full appearance-none rounded-sm border border-stone bg-white py-0 pl-4 pr-10 text-sm text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                      >
                        <option value="all">{SEARCH_SCHEMA.copy.allColorsLabel}</option>
                        {facetOptions.colorOptions.map((color) => (
                          <option key={color} value={color}>
                            {color}
                          </option>
                        ))}
                      </select>
                      <ChevronIcon />
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={closeMobileFilters}
                  className="font-label inline-flex min-h-12 items-center justify-center rounded-sm bg-primary px-6 py-3 text-sm font-medium uppercase tracking-[0.2em] text-obsidian shadow-sm transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                >
                  {SEARCH_SCHEMA.copy.showCountCta
                    .replace('{count}', String(designMatches.length))
                    .replace('{label}', designMatches.length === 1 ? SEARCH_SCHEMA.copy.designSingular : SEARCH_SCHEMA.copy.designPlural)}
                </button>
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="font-label inline-flex min-h-11 items-center justify-center rounded-sm border border-stone bg-white px-6 py-3 text-[11px] font-medium uppercase tracking-[0.2em] text-obsidian shadow-sm transition-colors hover:border-desert-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                  >
                    {SEARCH_SCHEMA.copy.resetFiltersCta}
                  </button>
                ) : null}
              </div>
            </div>
          </div>,
          document.body,
        )
        : null}

      <ProductQuickView open={quickViewSlug !== null} productSlug={quickViewSlug} onClose={() => setQuickViewSlug(null)} />
    </div>
  );
}
