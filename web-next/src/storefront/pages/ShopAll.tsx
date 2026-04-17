import { Link, useSearchParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppIcon } from '../components/AppIcon';
import { MerchProductCard } from '../components/MerchProductCard';
import { PageBreadcrumb } from '../components/PageBreadcrumb';
import { ProductQuickView } from '../components/ProductQuickView';
import { SEARCH_SCHEMA } from '../data/domain-config';
import { useUiLocale } from '../i18n/ui-locale';
import { useMediaQuery } from '../hooks/useMediaQuery';
import {
  fetchStorefrontSearch,
  isStorefrontServerSearchConfigured,
  shouldUseBrowserStorefrontSearch,
} from '../lib/medusa/storefront-search-client';
import {
  getSearchFacetOptions,
  getSearchFacetOptionsFromProducts,
  getSearchResults,
  getSearchResultsFromProducts,
  parseSearchSizeFilter,
  type SearchDesignCard,
  type SearchPriceFilter,
  type SearchSortKey,
} from '../search/view';
import { defaultCatalogSizeKeys } from '../utils/productSizes';
import type { Product } from '../data/site';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const useMedusaServerBrowse =
  typeof process !== 'undefined' &&
  isStorefrontServerSearchConfigured() &&
  shouldUseBrowserStorefrontSearch() &&
  process.env.NEXT_PUBLIC_STOREFRONT_SERVER_SEARCH !== '0';

const SORT_OPTIONS: { value: SearchSortKey; label: string }[] = [
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

const SIZE_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: SEARCH_SCHEMA.copy.allSizesLabel },
  ...defaultCatalogSizeKeys().map((size) => ({ value: size, label: size })),
];

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

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((element) => {
    if (element.hasAttribute('disabled')) return false;
    if (element.getAttribute('aria-hidden') === 'true') return false;
    if (element.tabIndex < 0 && element.tagName !== 'A' && element.tagName !== 'BUTTON') return false;
    return true;
  });
}

function browseChipClass(isActive: boolean) {
  return `font-label inline-flex min-h-11 items-center rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] transition-colors ${
    isActive
      ? 'border-obsidian bg-obsidian text-white'
      : 'border-stone bg-white text-obsidian hover:border-desert-sand'
  }`;
}

function ShopAllProductCard({
  product,
  onQuickView,
}: {
  product: SearchDesignCard;
  onQuickView: (slug: string) => void;
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
      promoLabel={product.promoLabel}
      proofChip={product.proofChip}
      eyebrow={product.feelingName}
      eyebrowAccent={product.feelingAccent}
      artistCredit={product.artistCredit}
      onQuickView={onQuickView}
    />
  );
}

function formatDesignCount(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function ShopAll() {
  const [params, setParams] = useSearchParams();
  const { copy, locale } = useUiLocale();
  const isArabic = locale === 'ar';
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [quickViewSlug, setQuickViewSlug] = useState<string | null>(null);
  const [desktopFiltersOpen, setDesktopFiltersOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [medusaBrowsePool, setMedusaBrowsePool] = useState<Product[]>([]);
  const [medusaBrowseStatus, setMedusaBrowseStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');

  const mobileFilterSheetRef = useRef<HTMLDivElement>(null);
  const mobileFilterCloseBtnRef = useRef<HTMLButtonElement>(null);
  const mobileFilterTriggerRef = useRef<HTMLElement | null>(null);

  const sortKey = SORT_OPTIONS.some((option) => option.value === params.get('sort'))
    ? (params.get('sort') as SearchSortKey)
    : 'featured';
  const priceFilter = PRICE_OPTIONS.some((option) => option.value === params.get('price'))
    ? (params.get('price') as SearchPriceFilter)
    : 'all';
  const sizeFilter = parseSearchSizeFilter(params.get('size'));

  const fallbackFacetOptions = useMemo(() => getSearchFacetOptions(), []);
  const feelingFilter = params.get('feelingFilter') ?? params.get('vibeFilter') ?? 'all';
  const rawFilterArtist = params.get('fArtist') ?? 'all';
  const rawFilterOccasion = params.get('fOccasion') ?? 'all';
  const rawFilterColor = params.get('fColor') ?? 'all';

  useEffect(() => {
    if (!useMedusaServerBrowse) {
      setMedusaBrowseStatus('idle');
      return;
    }

    let cancelled = false;
    setMedusaBrowseStatus('loading');
    void fetchStorefrontSearch({ page: 1, pageSize: 400 }).then((response) => {
      if (cancelled) return;
      if (response.ok) {
        setMedusaBrowsePool(response.data.products);
        setMedusaBrowseStatus('ok');
      } else {
        setMedusaBrowsePool([]);
        setMedusaBrowseStatus('error');
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setMobileFiltersOpen(false);
    }
  }, [isMobile]);

  const facetOptions = useMemo(() => {
    if (useMedusaServerBrowse && medusaBrowseStatus === 'ok') {
      return getSearchFacetOptionsFromProducts(medusaBrowsePool);
    }
    return fallbackFacetOptions;
  }, [fallbackFacetOptions, medusaBrowsePool, medusaBrowseStatus]);

  const filterArtist = facetOptions.artistOptions.some((option) => option.slug === rawFilterArtist) ? rawFilterArtist : 'all';
  const filterOccasion = facetOptions.occasionOptions.some((option) => option.slug === rawFilterOccasion) ? rawFilterOccasion : 'all';
  const filterColor = facetOptions.colorOptions.includes(rawFilterColor) ? rawFilterColor : 'all';

  const results = useMemo(() => {
    const queryParams = {
      query: '',
      sortKey,
      priceFilter,
      feelingFilter,
      sizeFilter,
      filterArtist,
      filterOccasion,
      filterColor,
      scopeFeelingSlug: null,
      scopeOccasionSlug: null,
    };
    if (useMedusaServerBrowse && medusaBrowseStatus === 'ok') {
      return getSearchResultsFromProducts(medusaBrowsePool, queryParams);
    }
    return getSearchResults(queryParams);
  }, [feelingFilter, filterArtist, filterColor, filterOccasion, medusaBrowsePool, medusaBrowseStatus, priceFilter, sizeFilter, sortKey]);

  const visibleCount = results.designMatches.length;
  const totalCount = results.baseDesigns.length;
  const designSingularLabel = isArabic ? 'تصميم' : SEARCH_SCHEMA.copy.designSingular;
  const designPluralLabel = isArabic ? 'تصاميم' : SEARCH_SCHEMA.copy.designPlural;
  const hasActiveFilters =
    sortKey !== 'featured' ||
    priceFilter !== 'all' ||
    sizeFilter !== 'all' ||
    feelingFilter !== 'all' ||
    filterArtist !== 'all' ||
    filterOccasion !== 'all' ||
    filterColor !== 'all';
  const resultCountCopy =
    visibleCount === totalCount
      ? formatDesignCount(totalCount, designSingularLabel, designPluralLabel)
      : `${visibleCount}/${totalCount} ${isArabic ? 'تصاميم' : 'designs'}`;
  const mobileShowCountLabel = isArabic
    ? `اعرض ${visibleCount} ${visibleCount === 1 ? 'تصميم' : 'تصاميم'}`
    : SEARCH_SCHEMA.copy.showCountCta
      .replace('{count}', String(visibleCount))
      .replace('{label}', visibleCount === 1 ? designSingularLabel : designPluralLabel);

  const searchUtilityLink = '/search?focus=1';

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      setParams((current) => {
        const next = new URLSearchParams(current);
        for (const [key, value] of Object.entries(updates)) {
          if (!value || value === 'all') {
            next.delete(key);
          } else {
            next.set(key, value);
          }
        }
        return next;
      });
    },
    [setParams],
  );

  const resetFilters = useCallback(() => {
    setParams((current) => {
      const next = new URLSearchParams(current);
      next.delete('sort');
      next.delete('price');
      next.delete('size');
      next.delete('feelingFilter');
      next.delete('vibeFilter');
      next.delete('fArtist');
      next.delete('fOccasion');
      next.delete('fColor');
      return next;
    });
  }, [setParams]);

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

  return (
    <div className="bg-papyrus pb-16 md:pb-20">
      <div className="mx-auto max-w-7xl px-4 pt-8 md:px-8 md:pt-10">
        <PageBreadcrumb
          className="mb-6"
          items={[
            { label: copy.shell.home, to: '/' },
            { label: copy.shell.shopAll },
          ]}
        />

        <section className="border-b border-stone/25 pb-6 md:pb-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="font-label text-[10px] font-medium uppercase tracking-[0.24em] text-label">
                {isArabic ? 'ابدأ من هنا' : 'Start here'}
              </p>
              <h1 className="font-headline mt-2 text-[clamp(2rem,4vw,3rem)] font-semibold tracking-tight text-obsidian">
                {copy.shell.shopAll}
              </h1>
              <p className="mt-3 font-body text-[1rem] leading-relaxed text-warm-charcoal md:text-[1.05rem]">
                {isArabic
                  ? 'شاهد كل التصاميم أولاً، ثم استخدم الفلاتر فقط إذا احتجت لتضييق الاختيار.'
                  : 'See the full product grid first, then narrow only if you need to.'}
              </p>
            </div>

            <div className="flex flex-col items-start gap-2 md:items-end">
              <p className="font-label text-[10px] font-medium uppercase tracking-[0.22em] text-clay">
                {resultCountCopy}
              </p>
              <Link
                to={searchUtilityLink}
                className="font-label inline-flex min-h-11 items-center text-[11px] font-medium uppercase tracking-[0.18em] text-deep-teal transition-colors hover:text-obsidian"
              >
                {isArabic ? 'هل تبحث بكلمة محددة؟' : 'Need keyword search?'}
              </Link>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <button
              type="button"
              className={browseChipClass(sortKey === 'featured')}
              onClick={() => updateParams({ sort: 'featured' })}
            >
              {isArabic ? 'الأكثر مبيعاً' : 'Best sellers'}
            </button>
            <button
              type="button"
              className={browseChipClass(sortKey === 'newest')}
              onClick={() => updateParams({ sort: sortKey === 'newest' ? null : 'newest' })}
            >
              {isArabic ? 'إصدار جديد' : 'New drop'}
            </button>
            <button
              type="button"
              className={browseChipClass(filterOccasion === 'gift-something-real')}
              onClick={() => updateParams({ fOccasion: filterOccasion === 'gift-something-real' ? null : 'gift-something-real' })}
            >
              {isArabic ? 'جاهز للهدايا' : 'Gift-ready'}
            </button>
            <button
              type="button"
              className={browseChipClass(priceFilter === 'under-800')}
              onClick={() => updateParams({ price: priceFilter === 'under-800' ? null : 'under-800' })}
            >
              {SEARCH_SCHEMA.copy.under800Label}
            </button>
          </div>
        </section>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-10">
        <section aria-labelledby="shop-all-grid-title">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-stone/25 pb-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={isMobile ? openMobileFilters : () => setDesktopFiltersOpen((open) => !open)}
                className="font-label inline-flex min-h-12 items-center rounded-sm border border-stone bg-white px-5 py-3 text-[11px] font-medium uppercase tracking-[0.2em] text-obsidian shadow-sm transition-colors hover:border-desert-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
              >
                {SEARCH_SCHEMA.copy.filterAndSortCta}
              </button>
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="font-label inline-flex min-h-12 items-center text-[11px] font-medium uppercase tracking-[0.18em] text-deep-teal transition-colors hover:text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                >
                  {SEARCH_SCHEMA.copy.resetFiltersCta}
                </button>
              ) : null}
            </div>

            <div className="flex items-center gap-4">
              <p
                id="shop-all-grid-title"
                className="font-body text-sm text-warm-charcoal"
              >
                {visibleCount === totalCount
                  ? formatDesignCount(visibleCount, designSingularLabel, designPluralLabel)
                  : `${visibleCount} ${isArabic ? 'ظاهر الآن' : 'showing now'}`}
              </p>
            </div>
          </div>

          {!isMobile && desktopFiltersOpen ? (
            <div className="mb-8 flex flex-wrap items-end gap-4 rounded-[18px] border border-stone/35 bg-white/72 p-4 shadow-[0_18px_44px_-30px_rgba(26,26,26,0.18)]">
              <div className="flex min-w-[13rem] flex-col gap-2">
                <label htmlFor="shop-all-sort" className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-label">
                  {SEARCH_SCHEMA.copy.sortLabel}
                </label>
                <div className="relative">
                  <select
                    id="shop-all-sort"
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
                <label htmlFor="shop-all-price" className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-label">
                  {SEARCH_SCHEMA.copy.priceLabel}
                </label>
                <div className="relative">
                  <select
                    id="shop-all-price"
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

              <div className="flex min-w-[13rem] flex-col gap-2">
                <label htmlFor="shop-all-size" className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-label">
                  {SEARCH_SCHEMA.copy.sizeFilterLabel}
                </label>
                <div className="relative">
                  <select
                    id="shop-all-size"
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

              {results.vibeOptions.length > 1 ? (
                <div className="flex min-w-[13rem] flex-col gap-2">
                  <label htmlFor="shop-all-feeling" className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-label">
                    {SEARCH_SCHEMA.copy.vibeLabel}
                  </label>
                  <div className="relative">
                    <select
                      id="shop-all-feeling"
                      value={feelingFilter}
                      onChange={(event) => updateParams({ feelingFilter: event.target.value, vibeFilter: null })}
                      className="min-h-12 w-full appearance-none rounded-sm border border-stone bg-white py-0 pl-4 pr-10 text-sm text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                    >
                      <option value="all">{SEARCH_SCHEMA.copy.allVibesLabel}</option>
                      {results.vibeOptions.map((option) => (
                        <option key={option.slug} value={option.slug}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                    <ChevronIcon />
                  </div>
                </div>
              ) : null}

              {facetOptions.artistOptions.length > 1 ? (
                <div className="flex min-w-[13rem] flex-col gap-2">
                  <label htmlFor="shop-all-artist" className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-label">
                    {SEARCH_SCHEMA.copy.artistLabel}
                  </label>
                  <div className="relative">
                    <select
                      id="shop-all-artist"
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
                  <label htmlFor="shop-all-occasion" className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-label">
                    {SEARCH_SCHEMA.copy.occasionFilterLabel}
                  </label>
                  <div className="relative">
                    <select
                      id="shop-all-occasion"
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
                  <label htmlFor="shop-all-color" className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-label">
                    {SEARCH_SCHEMA.copy.colorLabel}
                  </label>
                  <div className="relative">
                    <select
                      id="shop-all-color"
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
          ) : null}

          {results.designMatches.length > 0 ? (
            <div className="vibe-product-grid">
              {results.designMatches.map((product) => (
                <ShopAllProductCard
                  key={product.slug}
                  product={product}
                  onQuickView={setQuickViewSlug}
                />
              ))}
            </div>
          ) : (
            <div className="card-glass rounded-[18px] border border-stone/70 px-6 py-10 text-center">
              <h2 className="font-headline text-[1.45rem] font-semibold tracking-tight text-obsidian">
                {isArabic ? 'لا توجد تصاميم بهذه التصفية' : 'No designs match these filters'}
              </h2>
              <p className="mt-3 font-body text-[0.98rem] leading-relaxed text-warm-charcoal">
                {isArabic
                  ? 'ارجع إلى كل التصاميم أو جرّب التصفح حسب المشاعر أو المناسبات.'
                  : 'Reset to the full grid, or browse by feelings and occasions instead.'}
              </p>
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <button type="button" className="btn btn-primary" onClick={resetFilters}>
                  {SEARCH_SCHEMA.copy.resetFiltersCta}
                </button>
                <Link className="btn btn-secondary text-sm" to="/feelings">
                  {isArabic ? 'تصفّح المشاعر' : 'Browse feelings'}
                </Link>
                <Link className="btn btn-ghost" to="/occasions">
                  {isArabic ? 'تصفّح المناسبات' : 'Browse occasions'}
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>

      {isMobile && mobileFiltersOpen && typeof document !== 'undefined'
        ? createPortal(
          <div className="fixed inset-0 z-[240] bg-black/55 backdrop-blur-sm" onClick={closeMobileFilters}>
            <div
              ref={mobileFilterSheetRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="mobile-shop-all-filters-title"
              className="absolute inset-x-0 bottom-0 rounded-t-[1.5rem] bg-papyrus px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-5 shadow-[0_-24px_64px_-24px_rgba(0,0,0,0.38)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-label text-[10px] font-medium uppercase tracking-[0.24em] text-label">{copy.shell.shopAll}</p>
                  <h2 id="mobile-shop-all-filters-title" className="font-headline mt-2 text-2xl font-semibold tracking-tight text-obsidian">
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

              <div className="grid gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="mobile-shop-all-sort" className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-label">
                    {SEARCH_SCHEMA.copy.sortLabel}
                  </label>
                  <div className="relative">
                    <select
                      id="mobile-shop-all-sort"
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
                  <label htmlFor="mobile-shop-all-price" className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-label">
                    {SEARCH_SCHEMA.copy.priceLabel}
                  </label>
                  <div className="relative">
                    <select
                      id="mobile-shop-all-price"
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

                <div className="flex flex-col gap-2">
                  <label htmlFor="mobile-shop-all-size" className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-label">
                    {SEARCH_SCHEMA.copy.sizeFilterLabel}
                  </label>
                  <div className="relative">
                    <select
                      id="mobile-shop-all-size"
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

                {results.vibeOptions.length > 1 ? (
                  <div className="flex flex-col gap-2">
                    <label htmlFor="mobile-shop-all-feeling" className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-label">
                      {SEARCH_SCHEMA.copy.vibeLabel}
                    </label>
                    <div className="relative">
                      <select
                        id="mobile-shop-all-feeling"
                        value={feelingFilter}
                        onChange={(event) => updateParams({ feelingFilter: event.target.value, vibeFilter: null })}
                        className="min-h-12 w-full appearance-none rounded-sm border border-stone bg-white py-0 pl-4 pr-10 text-sm text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                      >
                        <option value="all">{SEARCH_SCHEMA.copy.allVibesLabel}</option>
                        {results.vibeOptions.map((option) => (
                          <option key={option.slug} value={option.slug}>
                            {option.name}
                          </option>
                        ))}
                      </select>
                      <ChevronIcon />
                    </div>
                  </div>
                ) : null}

                {facetOptions.artistOptions.length > 1 ? (
                  <div className="flex flex-col gap-2">
                    <label htmlFor="mobile-shop-all-artist" className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-label">
                      {SEARCH_SCHEMA.copy.artistLabel}
                    </label>
                    <div className="relative">
                      <select
                        id="mobile-shop-all-artist"
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
                    <label htmlFor="mobile-shop-all-occasion" className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-label">
                      {SEARCH_SCHEMA.copy.occasionFilterLabel}
                    </label>
                    <div className="relative">
                      <select
                        id="mobile-shop-all-occasion"
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
                    <label htmlFor="mobile-shop-all-color" className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-label">
                      {SEARCH_SCHEMA.copy.colorLabel}
                    </label>
                    <div className="relative">
                      <select
                        id="mobile-shop-all-color"
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

              <div className="mt-6 flex items-center justify-between gap-3">
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="font-label inline-flex min-h-12 items-center text-[11px] font-medium uppercase tracking-[0.18em] text-deep-teal"
                  >
                    {SEARCH_SCHEMA.copy.resetFiltersCta}
                  </button>
                ) : <span />}
                <button type="button" onClick={closeMobileFilters} className="btn btn-primary">
                  {mobileShowCountLabel}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )
        : null}

      {quickViewSlug ? (
        <ProductQuickView open productSlug={quickViewSlug} onClose={() => setQuickViewSlug(null)} />
      ) : null}
    </div>
  );
}
