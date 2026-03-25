import { Link, useSearchParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ProductQuickView } from '../components/ProductQuickView';
import { TeeImageFrame } from '../components/TeeImage';
import { SEARCH_SCHEMA } from '../data/domain-config';
import { heroStreet, imgUrl, vibeCovers } from '../data/images';
import { getOccasion, getVibe } from '../data/site';
import { useMediaQuery } from '../hooks/useMediaQuery';
import {
  getSearchResults,
  type SearchArtistCard,
  type SearchDesignCard,
  type SearchPriceFilter,
  type SearchSortKey,
  type SearchTab,
  type SearchVibeCard,
} from '../search/view';
import { formatEgp } from '../utils/formatPrice';

const SEARCH_DEBOUNCE_MS = 300;
const POPULAR_SEARCHES = ['Emotions', 'Zodiac', 'Street', 'Gift', 'Coffee', 'HORO'] as const;
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const TAB_IDS: SearchTab[] = ['designs', 'vibes', 'artists'];
const SORT_IDS: SearchSortKey[] = ['relevance', 'featured', 'newest', 'price-asc', 'price-desc'];
const PRICE_IDS: SearchPriceFilter[] = ['all', 'under-800', '800-899', '900+'];

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

function SearchProductCard({
  product,
  isMobile,
  onQuickView,
}: {
  product: SearchDesignCard;
  isMobile: boolean;
  onQuickView: (slug: string) => void;
}) {
  return (
    <article className="group flex flex-col">
      <div className="relative mb-4 w-full">
        <Link
          to={`/products/${product.slug}`}
          className="block overflow-hidden rounded-md bg-surface-container-high shadow-sm ring-1 ring-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
        >
          <div className="transition-transform duration-700 ease-out group-hover:scale-[1.03]">
            <TeeImageFrame
              src={product.imageSrc}
              alt={product.imageAlt}
              w={700}
              aspectRatio="4/5"
              borderRadius="0.375rem"
              frameStyle={{ marginBottom: 0 }}
            />
          </div>
          {product.merchandisingBadge ? (
            <span className="font-label absolute left-3 top-3 z-10 rounded-sm border border-white/70 bg-white/78 px-3 py-2 text-[10px] font-medium uppercase tracking-[0.18em] text-obsidian shadow-sm backdrop-blur-sm">
              {product.merchandisingBadge}
            </span>
          ) : null}
        </Link>
        {!isMobile ? (
          <button
            type="button"
            className="quick-view-pill quick-view-pill--hover font-label absolute bottom-3 left-3 right-3 z-10 min-h-12 rounded-full px-4 py-3 text-center text-xs font-medium uppercase tracking-[0.2em] text-obsidian transition-shadow hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
            onClick={() => onQuickView(product.slug)}
            aria-label={`Quick view: ${product.name}`}
          >
            {SEARCH_SCHEMA.copy.quickViewCta}
          </button>
        ) : null}
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {product.artistName ? <p className="font-body text-xs text-clay-earth">{product.artistName}</p> : null}
          <Link
            to={`/products/${product.slug}`}
            className="font-headline mt-1 block text-[1.08rem] font-semibold leading-snug tracking-[0.01em] text-obsidian transition-colors hover:text-clay focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
          >
            {product.name}
          </Link>
          {product.vibeName ? (
            <p className="mt-2 font-body text-xs text-warm-charcoal">
              <span style={{ color: product.vibeAccent ?? 'var(--deep-teal)' }}>●</span> {product.vibeName}
            </p>
          ) : null}
          <p className="font-pdp-serif mt-2 text-[1.125rem] font-normal text-obsidian">{formatEgp(product.priceEgp)}</p>
        </div>
      </div>
    </article>
  );
}

function SearchVibeResultCard({ vibe }: { vibe: SearchVibeCard }) {
  return (
    <Link
      to={`/vibes/${vibe.slug}`}
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

function SearchArtistResultCard({ artist, to }: { artist: SearchArtistCard; to: string }) {
  return (
    <Link
      to={to}
      className="group block overflow-hidden rounded-[18px] border border-stone/70 bg-white/72 text-inherit no-underline shadow-[0_18px_44px_-28px_rgba(26,26,26,0.24)] transition-transform duration-300 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
    >
      <div className="overflow-hidden">
        <TeeImageFrame src={artist.imageSrc} alt={artist.imageAlt} w={640} aspectRatio="4/5" borderRadius="0" />
      </div>
      <div className="space-y-2 p-4">
        <p className="font-headline text-lg font-semibold leading-snug text-obsidian">{artist.name}</p>
        <p className="font-body text-sm leading-relaxed text-warm-charcoal">{artist.style}</p>
        <p className="font-label text-[10px] font-medium uppercase tracking-[0.18em] text-label">{formatDesignCount(artist.designCount)}</p>
        <span className="font-label inline-flex min-h-11 items-center text-[10px] font-medium uppercase tracking-[0.18em] text-deep-teal">
          {SEARCH_SCHEMA.copy.viewDesignsCta}
        </span>
      </div>
    </Link>
  );
}

export function Search() {
  const [params, setParams] = useSearchParams();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileFilterSheetRef = useRef<HTMLDivElement>(null);
  const mobileFilterCloseBtnRef = useRef<HTMLButtonElement>(null);
  const mobileFilterTriggerRef = useRef<HTMLElement | null>(null);

  const urlQuery = params.get('q') ?? '';
  const [q, setQ] = useState(urlQuery);
  const [debouncedQ, setDebouncedQ] = useState(urlQuery);
  const [quickViewSlug, setQuickViewSlug] = useState<string | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const tab = TAB_IDS.includes((params.get('tab') ?? '') as SearchTab) ? (params.get('tab') as SearchTab) : 'designs';
  const sortKey = SORT_IDS.includes((params.get('sort') ?? '') as SearchSortKey) ? (params.get('sort') as SearchSortKey) : 'relevance';
  const priceFilter = PRICE_IDS.includes((params.get('price') ?? '') as SearchPriceFilter)
    ? (params.get('price') as SearchPriceFilter)
    : 'all';
  const artistSlug = params.get('artist') ?? 'all';
  const vibeFilter = params.get('vibeFilter') ?? 'all';

  const scopeVibe = useMemo(() => {
    const value = params.get('vibe') ?? '';
    if (!value.trim()) return null;
    return getVibe(value) ?? null;
  }, [params]);

  const scopeOccasion = useMemo(() => {
    const value = params.get('occasion') ?? '';
    if (!value.trim()) return null;
    return getOccasion(value) ?? null;
  }, [params]);

  useEffect(() => {
    setQ(urlQuery);
    setDebouncedQ(urlQuery);
  }, [urlQuery]);

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
          (key === 'tab' && value === 'designs') ||
          (key === 'sort' && value === 'relevance') ||
          (key === 'price' && value === 'all') ||
          (key === 'artist' && value === 'all') ||
          (key === 'vibeFilter' && value === 'all')
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

  const searchResults = useMemo(
    () =>
      getSearchResults({
        query: debouncedQ,
        scopeOccasionSlug: scopeOccasion?.slug,
        scopeVibeSlug: scopeVibe?.slug,
        sortKey,
        priceFilter,
        vibeFilter,
        artistSlug,
      }),
    [artistSlug, debouncedQ, priceFilter, scopeOccasion?.slug, scopeVibe?.slug, sortKey, vibeFilter],
  );

  const { baseDesigns, designMatches, vibeMatches, artistMatches, vibeOptions, artistOptions } = searchResults;
  const totalResults = designMatches.length + vibeMatches.length + artistMatches.length;
  const inputEmpty = q.trim().length === 0;
  const hasDebouncedQuery = debouncedQ.trim().length > 0;
  const hasActiveFilters = sortKey !== 'relevance' || priceFilter !== 'all' || vibeFilter !== 'all' || artistSlug !== 'all';
  const noResultsAcrossTabs = hasDebouncedQuery && totalResults === 0;

  const scopeLabels = [scopeOccasion?.name, scopeVibe?.name].filter(Boolean);
  const scopeSummary = scopeLabels.join(' · ');

  const clearScopeTo = useMemo(() => {
    const next = new URLSearchParams(params);
    next.delete('vibe');
    next.delete('occasion');
    next.delete('focus');
    const queryString = next.toString();
    return queryString ? `/search?${queryString}` : '/search';
  }, [params]);

  const leadVisual = useMemo(() => {
    if (scopeOccasion) {
      return { src: scopeOccasion.heroImageSrc, alt: scopeOccasion.heroImageAlt };
    }
    if (scopeVibe) {
      return {
        src: vibeCovers[scopeVibe.slug] ?? heroStreet,
        alt: `${scopeVibe.name} vibe — HORO editorial styling.`,
      };
    }
    if (designMatches[0]) {
      return { src: designMatches[0].imageSrc, alt: designMatches[0].imageAlt };
    }
    if (baseDesigns[0]) {
      return { src: baseDesigns[0].imageSrc, alt: baseDesigns[0].imageAlt };
    }
    return { src: heroStreet, alt: 'HORO search — editorial styling in a graphic tee.' };
  }, [baseDesigns, designMatches, scopeOccasion, scopeVibe]);

  const summaryText = hasDebouncedQuery
    ? SEARCH_SCHEMA.copy.resultsForQuery
      .replace('{count}', String(totalResults))
      .replace('{query}', debouncedQ.trim())
    : scopeSummary
      ? SEARCH_SCHEMA.copy.scopedResultsFallback.replace('{scope}', scopeSummary)
      : SEARCH_SCHEMA.copy.resultsFallback;

  const activeTabEmptyCopy =
    tab === 'designs'
      ? SEARCH_SCHEMA.copy.noDesignResults
      : tab === 'vibes'
        ? SEARCH_SCHEMA.copy.noVibeResults
        : SEARCH_SCHEMA.copy.noArtistResults;

  const buildArtistSearchTo = useCallback(
    (slug: string) => {
      const next = new URLSearchParams();
      if (scopeOccasion?.slug) next.set('occasion', scopeOccasion.slug);
      if (scopeVibe?.slug) next.set('vibe', scopeVibe.slug);
      next.set('artist', slug);
      const queryString = next.toString();
      return queryString ? `/search?${queryString}` : '/search';
    },
    [scopeOccasion?.slug, scopeVibe?.slug],
  );

  const resetFilters = useCallback(() => {
    updateParams({
      sort: 'relevance',
      price: 'all',
      vibeFilter: 'all',
      artist: 'all',
    });
  }, [updateParams]);

  return (
    <div className="bg-papyrus pb-16 md:pb-20">
      <a
        href="#search-results-panel"
        className="sr-only left-4 top-[max(0.75rem,env(safe-area-inset-top))] z-250 rounded-sm border border-outline-variant/50 bg-papyrus px-4 py-3 font-label text-[11px] font-semibold uppercase tracking-widest text-obsidian shadow-md outline-none ring-deep-teal focus:not-sr-only focus:fixed focus:ring-2"
      >
        Skip to results
      </a>

      <div className="mx-auto min-h-[calc(100vh-10rem)] max-w-7xl px-6 pt-8 pb-12 md:px-10 md:pt-10 md:pb-16">
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

              <div className="relative">
                <label htmlFor="search-page-input" className="sr-only">
                  {SEARCH_SCHEMA.copy.searchLabel}
                </label>
                <input
                  ref={inputRef}
                  id="search-page-input"
                  type="search"
                  value={q}
                  onChange={(event) => setQ(event.target.value)}
                  placeholder={SEARCH_SCHEMA.copy.placeholder}
                  className="font-body min-h-14 w-full rounded-sm border border-stone/80 bg-white/92 px-4 pr-14 text-base text-obsidian shadow-sm placeholder:text-clay/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                  autoComplete="off"
                />
                {q.trim() ? (
                  <button
                    type="button"
                    onClick={() => {
                      setQ('');
                      setDebouncedQ('');
                    }}
                    className="material-symbols-outlined absolute right-2 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full text-obsidian/72 transition-colors hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                    aria-label="Clear search"
                  >
                    close
                  </button>
                ) : null}
              </div>

              <p className="font-body text-sm leading-relaxed text-warm-charcoal md:text-[0.98rem]">{summaryText}</p>

              {inputEmpty ? (
                <div className="flex flex-wrap gap-2">
                  <span className="font-label basis-full text-[10px] font-medium uppercase tracking-[0.22em] text-label">
                    {SEARCH_SCHEMA.copy.popularLabel}
                  </span>
                  {POPULAR_SEARCHES.map((label) => (
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

        <section id="search-results-panel" className="mt-10 scroll-mt-[calc(5.5rem+env(safe-area-inset-top,0px))] md:mt-12">
          <div className="mb-6 flex flex-wrap gap-2 border-b border-stone/30 pb-3 md:mb-8">
            {[
              ['designs', `${SEARCH_SCHEMA.copy.designsTab} (${designMatches.length})`],
              ['vibes', `${SEARCH_SCHEMA.copy.vibesTab} (${vibeMatches.length})`],
              ['artists', `${SEARCH_SCHEMA.copy.artistsTab} (${artistMatches.length})`],
            ].map(([id, label]) => {
              const tabId = id as SearchTab;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => updateParams({ tab: tabId })}
                  className={`font-label inline-flex min-h-12 items-center rounded-full border px-4 py-3 text-[11px] font-medium uppercase tracking-[0.2em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal ${
                    tab === tabId
                      ? 'border-obsidian bg-obsidian text-white shadow-sm'
                      : 'border-stone bg-white/75 text-obsidian hover:border-desert-sand'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {tab === 'designs' ? (
            isMobile ? (
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
              <div className="sticky top-[calc(5.5rem+env(safe-area-inset-top,0px))] z-20 mb-8 flex items-end justify-between gap-6 border-b border-stone/30 bg-papyrus/95 pb-4 backdrop-blur-sm">
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
                          value={vibeFilter}
                          onChange={(event) => updateParams({ vibeFilter: event.target.value })}
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

                  {artistOptions.length > 1 ? (
                    <div className="flex min-w-[13rem] flex-col gap-2">
                      <label htmlFor="search-artist" className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-label">
                        {SEARCH_SCHEMA.copy.artistLabel}
                      </label>
                      <div className="relative">
                        <select
                          id="search-artist"
                          value={artistSlug}
                          onChange={(event) => updateParams({ artist: event.target.value })}
                          className="min-h-12 w-full appearance-none rounded-sm border border-stone bg-white py-0 pl-4 pr-10 text-sm text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                        >
                          <option value="all">{SEARCH_SCHEMA.copy.allArtistsLabel}</option>
                          {artistOptions.map((option) => (
                            <option key={option.slug} value={option.slug}>
                              {option.name}
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
            )
          ) : null}

          {noResultsAcrossTabs ? (
            <div className="card-glass mt-4 flex flex-col items-center border border-stone/70 px-6 py-10 text-center md:py-12">
              <h2 className="font-headline text-[1.45rem] font-semibold tracking-tight text-obsidian">
                {SEARCH_SCHEMA.copy.noResultsForQuery.replace('{query}', debouncedQ.trim())}
              </h2>
              <p className="mt-3 max-w-xl font-body text-[0.98rem] leading-relaxed text-warm-charcoal">
                Try a different word, or explore by vibe.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link className="btn btn-primary" to="/vibes">
                  {SEARCH_SCHEMA.copy.shopByVibeCta}
                </Link>
                <Link className="btn btn-ghost" to="/search">
                  {SEARCH_SCHEMA.copy.browseAllDesignsCta}
                </Link>
              </div>
            </div>
          ) : null}

          {!noResultsAcrossTabs && tab === 'designs' ? (
            <>
              <div className="vibe-product-grid">
                {designMatches.map((product) => (
                  <SearchProductCard key={product.slug} product={product} isMobile={isMobile} onQuickView={setQuickViewSlug} />
                ))}
              </div>

              {designMatches.length === 0 ? (
                <div className="mt-6">
                  <p className="font-body text-clay">
                    {hasActiveFilters ? SEARCH_SCHEMA.copy.noFilteredResults : activeTabEmptyCopy}{' '}
                    {hasActiveFilters ? (
                      <button type="button" onClick={resetFilters} className="border-0 bg-transparent font-medium text-deep-teal underline">
                        {SEARCH_SCHEMA.copy.resetFiltersCta}
                      </button>
                    ) : null}
                  </p>
                </div>
              ) : null}
            </>
          ) : null}

          {!noResultsAcrossTabs && tab === 'vibes' ? (
            <>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {vibeMatches.map((vibe) => (
                  <SearchVibeResultCard key={vibe.slug} vibe={vibe} />
                ))}
              </div>
              {vibeMatches.length === 0 ? <p className="mt-6 font-body text-warm-charcoal">{activeTabEmptyCopy}</p> : null}
            </>
          ) : null}

          {!noResultsAcrossTabs && tab === 'artists' ? (
            <>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {artistMatches.map((artist) => (
                  <SearchArtistResultCard key={artist.slug} artist={artist} to={buildArtistSearchTo(artist.slug)} />
                ))}
              </div>
              {artistMatches.length === 0 ? <p className="mt-6 font-body text-warm-charcoal">{activeTabEmptyCopy}</p> : null}
            </>
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
                  <p className="font-label text-[10px] font-medium uppercase tracking-[0.24em] text-label">{SEARCH_SCHEMA.copy.designsTab}</p>
                  <h2 id="mobile-search-filters-title" className="font-headline mt-2 text-2xl font-semibold tracking-tight text-obsidian">
                    {SEARCH_SCHEMA.copy.filterAndSortCta}
                  </h2>
                </div>
                <button
                  ref={mobileFilterCloseBtnRef}
                  type="button"
                  onClick={closeMobileFilters}
                  className="material-symbols-outlined inline-flex min-h-12 min-w-12 items-center justify-center rounded-full border border-stone bg-white text-obsidian shadow-sm transition-colors hover:border-desert-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                  aria-label="Close filters"
                >
                  close
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
                        value={vibeFilter}
                        onChange={(event) => updateParams({ vibeFilter: event.target.value })}
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

                {artistOptions.length > 1 ? (
                  <div className="flex flex-col gap-2">
                    <label htmlFor="mobile-search-artist" className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-label">
                      {SEARCH_SCHEMA.copy.artistLabel}
                    </label>
                    <div className="relative">
                      <select
                        id="mobile-search-artist"
                        value={artistSlug}
                        onChange={(event) => updateParams({ artist: event.target.value })}
                        className="min-h-12 w-full appearance-none rounded-sm border border-stone bg-white py-0 pl-4 pr-10 text-sm text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                      >
                        <option value="all">{SEARCH_SCHEMA.copy.allArtistsLabel}</option>
                        {artistOptions.map((option) => (
                          <option key={option.slug} value={option.slug}>
                            {option.name}
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
