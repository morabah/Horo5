'use client';

import Link from 'next/link';
import { useAppSearchParams } from '@/storefront/hooks/useAppSearchParams';
import { createPortal } from 'react-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppIcon } from '../components/AppIcon';
import { MerchProductCard } from '../components/MerchProductCard';
import { PageBreadcrumb } from '../components/PageBreadcrumb';
import { PageHero } from '../components/PageHero';
import { PAGE_HEROES } from '../content/page-heroes';
import { ExitIntentModal } from '../components/ExitIntentModal';
import { ProductQuickView } from '../components/ProductQuickView';
import { SkeletonGrid } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';
import { useUiLocale, useDictionary } from '../i18n/ui-locale';
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
  type SearchPriceBand,
  type SearchPriceFilter,
  type SearchSortKey,
} from '../search/view';
import { defaultCatalogSizeKeys } from '../utils/productSizes';
import { getProduct, getProducts, getSubfeeling, setRuntimeCatalog, type Product, type RuntimeCatalog } from '../data/site';
import { trackShopAllView } from '../analytics/funnel';
import { CollectionRouteIntro } from '../components/CollectionRouteIntro';
import { CategoryShortcutPills } from '../components/CategoryShortcutPills';
import { PLP_SCROLL_MARGIN, StickyPlpToolbar } from '../components/StickyPlpToolbar';
import {
  launchCategoryFilterLabel,
  parseLaunchCategoryFilter,
  productMatchesLaunchCategory,
} from '../lib/launch-taxonomy-display';

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

function ShopAllProductCard({
  product,
  onQuickView,
  eager = false,
}: {
  product: SearchDesignCard;
  onQuickView: (slug: string) => void;
  eager?: boolean;
}) {
  return (
    <MerchProductCard
      slug={product.slug}
      name={product.name}
      compareAtPriceEgp={product.originalPriceEgp ?? undefined}
      priceEgp={product.priceEgp}
      imageSrc={product.imageSrc}
      imageAlt={product.imageAlt}
      promoLabel={product.promoLabel}
      promoEndsAt={product.promoEndsAt}
      promoShowCountdown={product.promoShowCountdown}
      eyebrow={product.feelingName}
      artistCredit={product.artistCredit}
      onQuickView={onQuickView}
      eager={eager}
      variant="minimal"
    />
  );
}

function formatDesignCount(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

type LocalizedText = string | { en?: string; ar?: string };
type ShopAllPriceBand = SearchPriceBand & {
  label: LocalizedText;
};

function pickLocalizedText(value: LocalizedText, locale: 'en' | 'ar') {
  if (typeof value === 'string') return value.trim();
  const preferred = locale === 'ar' ? value.ar : value.en;
  const fallback = locale === 'ar' ? value.en : value.ar;
  return (preferred || fallback || '').trim();
}

export function ShopAll({
  initialCatalog = null,
  priceBands = null,
}: {
  initialCatalog?: Partial<RuntimeCatalog> | null;
  priceBands?: ShopAllPriceBand[] | null;
} = {}) {
  if (initialCatalog) {
    setRuntimeCatalog(initialCatalog);
  }

  const initialBrowseProducts = initialCatalog?.products ?? [];
  const hasInitialBrowseProducts = initialBrowseProducts.length > 0;
  const [params, setParams] = useAppSearchParams();
  const { locale } = useUiLocale();
  const copy = useDictionary();
  const isArabic = locale === 'ar';
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [quickViewSlug, setQuickViewSlug] = useState<string | null>(null);
  const [desktopFiltersOpen, setDesktopFiltersOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [medusaBrowsePool, setMedusaBrowsePool] = useState<Product[]>(initialBrowseProducts);
  const [medusaBrowseStatus, setMedusaBrowseStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>(
    hasInitialBrowseProducts ? 'ok' : 'idle',
  );

  const mobileFilterSheetRef = useRef<HTMLDivElement>(null);
  const mobileFilterCloseBtnRef = useRef<HTMLButtonElement>(null);
  const mobileFilterTriggerRef = useRef<HTMLElement | null>(null);

  const SIZE_FILTER_OPTIONS: { value: string; label: string }[] = [
    { value: 'all', label: copy.search.allSizesLabel },
    ...defaultCatalogSizeKeys().map((size) => ({ value: size, label: size })),
  ];
  const priceOptions = useMemo(() => {
    const defaultPriceOptions: { value: SearchPriceFilter; label: string }[] = [
      { value: 'all', label: copy.search.allPricesLabel },
      { value: 'under-800', label: copy.search.under800Label },
      { value: '800-899', label: copy.search.between800And899Label },
      { value: '900+', label: copy.search.over900Label },
    ];
    const configured =
      priceBands
        ?.filter((band) => band.key.trim() && pickLocalizedText(band.label, isArabic ? 'ar' : 'en'))
        .map((band) => ({
          value: band.key as SearchPriceFilter,
          label: pickLocalizedText(band.label, isArabic ? 'ar' : 'en'),
        })) ?? [];
    return configured.length > 0
      ? [{ value: 'all', label: copy.search.allPricesLabel }, ...configured]
      : defaultPriceOptions;
  }, [
    copy.search.allPricesLabel,
    copy.search.between800And899Label,
    copy.search.over900Label,
    copy.search.under800Label,
    isArabic,
    priceBands,
  ]);

  const rawSort = params.get('sort');
  const normalizedSort = rawSort === 'new' ? 'newest' : rawSort;
  const sortKey = SORT_OPTIONS.some((option) => option.value === normalizedSort)
    ? (normalizedSort as SearchSortKey)
    : 'featured';
  const priceFilter = priceOptions.some((option) => option.value === params.get('price'))
    ? (params.get('price') as SearchPriceFilter)
    : 'all';
  const sizeFilter = parseSearchSizeFilter(params.get('size'));

  const fallbackFacetOptions = useMemo(() => getSearchFacetOptions(), []);
  const feelingFilter = params.get('feelingFilter') ?? params.get('vibeFilter') ?? 'all';
  const categoryFilter = parseLaunchCategoryFilter(params.get('category'));
  const giftOnlyFilter = params.get('gift') === '1' || params.get('gift') === 'true';
  const rawFilterArtist = params.get('fArtist') ?? 'all';
  const rawFilterOccasion = params.get('fOccasion') ?? 'all';
  const rawFilterColor = params.get('fColor') ?? 'all';

  useEffect(() => {
    if (!useMedusaServerBrowse) {
      setMedusaBrowseStatus('idle');
      return;
    }
    if (hasInitialBrowseProducts) {
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
  }, [hasInitialBrowseProducts]);

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
      priceBands: priceBands ?? undefined,
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
  }, [feelingFilter, filterArtist, filterColor, filterOccasion, medusaBrowsePool, medusaBrowseStatus, priceBands, priceFilter, sizeFilter, sortKey]);

  const productLookup = useMemo(() => {
    const source =
      useMedusaServerBrowse && medusaBrowseStatus === 'ok' ? medusaBrowsePool : getProducts();
    return new Map(source.map((product) => [product.slug, product]));
  }, [medusaBrowsePool, medusaBrowseStatus]);

  const resolveProduct = useCallback(
    (slug: string) => productLookup.get(slug) ?? getProduct(slug),
    [productLookup],
  );

  const lineFilter = params.get('line') ?? 'all';
  const filteredDesignMatches = useMemo(() => {
    let matches = results.designMatches;
    if (lineFilter !== 'all') {
      matches = matches.filter((card) => {
        const product = resolveProduct(card.slug);
        if (!product) return false;
        return (product.primarySubfeelingSlug ?? product.lineSlug) === lineFilter;
      });
    }
    if (categoryFilter) {
      matches = matches.filter((card) => {
        const product = resolveProduct(card.slug);
        if (!product) return false;
        return productMatchesLaunchCategory(product, categoryFilter);
      });
    }
    if (giftOnlyFilter) {
      matches = matches.filter((card) => {
        const product = resolveProduct(card.slug);
        return Boolean(product?.giftable || product?.buyerRoute === 'gift');
      });
    }
    return matches;
  }, [categoryFilter, giftOnlyFilter, lineFilter, resolveProduct, results.designMatches]);

  const PLP_PAGE_SIZE = 24;
  const pageFromUrl = Math.max(1, Number.parseInt(params.get('page') ?? '1', 10) || 1);
  const totalPages = Math.max(1, Math.ceil(filteredDesignMatches.length / PLP_PAGE_SIZE));
  const currentPage = Math.min(pageFromUrl, totalPages);
  const pagedDesignMatches = useMemo(
    () => filteredDesignMatches.slice((currentPage - 1) * PLP_PAGE_SIZE, currentPage * PLP_PAGE_SIZE),
    [currentPage, filteredDesignMatches],
  );

  const setPage = useCallback(
    (nextPage: number) => {
      const next = new URLSearchParams(params.toString());
      if (nextPage <= 1) next.delete('page');
      else next.set('page', String(nextPage));
      setParams(next);
    },
    [params, setParams],
  );

  const visibleCount = filteredDesignMatches.length;
  const totalCount = results.baseDesigns.length;

  useEffect(() => {
    if (totalCount > 0) trackShopAllView(totalCount);
  }, [totalCount]);

  const designSingularLabel = isArabic ? 'تصميم' : copy.search.designSingular;
  const designPluralLabel = isArabic ? 'تصاميم' : copy.search.designPlural;
  const lineOptions = useMemo(() => {
    const slugs = new Set<string>();
    for (const card of results.designMatches) {
      const product = resolveProduct(card.slug);
      const slug = product?.primarySubfeelingSlug ?? product?.lineSlug;
      if (slug) slugs.add(slug);
    }
    return Array.from(slugs)
      .map((slug) => getSubfeeling(slug))
      .filter((line): line is NonNullable<typeof line> => Boolean(line))
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [resolveProduct, results.designMatches]);

  const hasActiveFilters =
    sortKey !== 'featured' ||
    priceFilter !== 'all' ||
    sizeFilter !== 'all' ||
    lineFilter !== 'all' ||
    feelingFilter !== 'all' ||
    categoryFilter !== null ||
    giftOnlyFilter ||
    filterArtist !== 'all' ||
    filterOccasion !== 'all' ||
    filterColor !== 'all';
  const categoryFilterLabel = launchCategoryFilterLabel(categoryFilter, locale);
  const resultCountCopy =
    visibleCount === totalCount
      ? formatDesignCount(totalCount, designSingularLabel, designPluralLabel)
      : `${visibleCount}/${totalCount} ${isArabic ? 'تصاميم' : 'designs'}`;
  const mobileShowCountLabel = isArabic
    ? `اعرض ${visibleCount} ${visibleCount === 1 ? 'تصميم' : 'تصاميم'}`
    : copy.search.showCountCta
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
      next.delete('line');
      next.delete('category');
      next.delete('gift');
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
      <PageHero config={PAGE_HEROES.shop} locale={isArabic ? 'ar' : 'en'} compact />
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
                {copy.shell.shopAllIntro}
              </p>
            </div>

            <div className="flex flex-col items-start gap-2 md:items-end">
              <p className="font-label text-[10px] font-medium uppercase tracking-[0.22em] text-clay">
                {resultCountCopy}
              </p>
              <Link
                href={searchUtilityLink}
                className="font-label inline-flex min-h-11 items-center text-[11px] font-medium uppercase tracking-[0.18em] text-deep-teal transition-colors hover:text-obsidian"
              >
                {isArabic ? 'هل تبحث بكلمة محددة؟' : 'Need keyword search?'}
              </Link>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <Button
              variant="chip"
              size="sm"
              active={sortKey === 'featured'}
              onClick={() => updateParams({ sort: 'featured' })}
            >
              {isArabic ? 'الأكثر مبيعاً' : 'Best sellers'}
            </Button>
            <Button
              variant="chip"
              size="sm"
              active={sortKey === 'newest'}
              onClick={() => updateParams({ sort: sortKey === 'newest' ? null : 'newest' })}
            >
              {isArabic ? 'إصدار جديد' : 'New drop'}
            </Button>
            <Button
              variant="chip"
              size="sm"
              active={giftOnlyFilter}
              onClick={() => updateParams({ gift: giftOnlyFilter ? null : '1' })}
            >
              {isArabic ? 'جاهز للهدايا' : 'Gift-ready'}
            </Button>
            <Button
              variant="chip"
              size="sm"
              active={priceFilter === (priceOptions[1]?.value ?? 'under-800')}
              onClick={() => {
                const firstBand = priceOptions[1]?.value ?? 'under-800';
                updateParams({ price: priceFilter === firstBand ? null : firstBand });
              }}
            >
              {priceOptions[1]?.label ?? copy.search.under800Label}
            </Button>
          </div>
        </section>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-10">
        {categoryFilter || giftOnlyFilter ? (
          <CollectionRouteIntro categoryFilter={categoryFilter ?? undefined} giftOnly={giftOnlyFilter} />
        ) : null}
        <section aria-labelledby="shop-all-grid-title" className={PLP_SCROLL_MARGIN}>
          <StickyPlpToolbar
            shortcuts={<CategoryShortcutPills />}
            actions={
              <>
                <button
                  type="button"
                  onClick={isMobile ? openMobileFilters : () => setDesktopFiltersOpen((open) => !open)}
                  className="font-label inline-flex min-h-12 items-center rounded-sm border border-stone bg-white px-5 py-3 text-[11px] font-medium uppercase tracking-[0.2em] text-obsidian shadow-sm transition-colors hover:border-desert-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                >
                  {copy.search.filterAndSortCta}
                </button>
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="font-label inline-flex min-h-12 items-center text-[11px] font-medium uppercase tracking-[0.18em] text-deep-teal transition-colors hover:text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                  >
                    {copy.search.resetFiltersCta}
                  </button>
                ) : null}
                <p
                  id="shop-all-grid-title"
                  className="font-body hidden text-sm text-warm-charcoal md:block"
                >
                  {visibleCount === totalCount
                    ? formatDesignCount(visibleCount, designSingularLabel, designPluralLabel)
                    : `${visibleCount} ${isArabic ? 'ظاهر الآن' : 'showing now'}`}
                </p>
              </>
            }
          />
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 md:hidden">
            <p className="font-body text-sm text-warm-charcoal">
              {visibleCount === totalCount
                ? formatDesignCount(visibleCount, designSingularLabel, designPluralLabel)
                : `${visibleCount} ${isArabic ? 'ظاهر الآن' : 'showing now'}`}
            </p>
          </div>
          <div className="mb-6 hidden flex-wrap items-center gap-3 border-b border-stone/25 pb-4 md:flex">
              <div className="hidden flex-wrap gap-2 md:flex">
                <button
                  type="button"
                  onClick={() => setDesktopFiltersOpen(true)}
                  className={`font-label inline-flex min-h-11 items-center rounded-full border px-4 text-[10px] font-semibold uppercase tracking-[0.16em] ${sizeFilter !== 'all' ? 'border-obsidian bg-obsidian text-white' : 'border-stone bg-white text-obsidian'}`}
                >
                  {copy.search.sizeFilterLabel}
                </button>
                <button
                  type="button"
                  onClick={() => setDesktopFiltersOpen(true)}
                  className={`font-label inline-flex min-h-11 items-center rounded-full border px-4 text-[10px] font-semibold uppercase tracking-[0.16em] ${priceFilter !== 'all' ? 'border-obsidian bg-obsidian text-white' : 'border-stone bg-white text-obsidian'}`}
                >
                  {copy.search.priceLabel}
                </button>
                <button
                  type="button"
                  onClick={() => setDesktopFiltersOpen(true)}
                  className={`font-label inline-flex min-h-11 items-center rounded-full border px-4 text-[10px] font-semibold uppercase tracking-[0.16em] ${feelingFilter !== 'all' ? 'border-obsidian bg-obsidian text-white' : 'border-stone bg-white text-obsidian'}`}
                >
                  {copy.search.vibeLabel}
                </button>
                {categoryFilterLabel ? (
                  <span className="font-label inline-flex min-h-11 items-center rounded-full border border-obsidian bg-obsidian px-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                    {categoryFilterLabel}
                  </span>
                ) : null}
              </div>
          </div>

          {desktopFiltersOpen ? (
            <div className="mb-8 hidden flex-wrap items-end gap-4 rounded-[18px] border border-stone/35 bg-white/72 p-4 shadow-[0_18px_44px_-30px_rgba(26,26,26,0.18)] md:flex">
              <div className="flex min-w-[13rem] flex-col gap-2">
                <label htmlFor="shop-all-sort" className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-label">
                  {copy.search.sortLabel}
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
                  {copy.search.priceLabel}
                </label>
                <div className="relative">
                  <select
                    id="shop-all-price"
                    value={priceFilter}
                    onChange={(event) => updateParams({ price: event.target.value })}
                    className="min-h-12 w-full appearance-none rounded-sm border border-stone bg-white py-0 pl-4 pr-10 text-sm text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                  >
                    {priceOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronIcon />
                </div>
              </div>

              {lineOptions.length > 1 ? (
                <div className="flex min-w-[13rem] flex-col gap-2">
                  <label htmlFor="shop-all-line" className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-label">
                    {isArabic ? 'الخط' : 'Line'}
                  </label>
                  <div className="relative">
                    <select
                      id="shop-all-line"
                      value={lineFilter}
                      onChange={(event) => updateParams({ line: event.target.value })}
                      className="min-h-12 w-full appearance-none rounded-sm border border-stone bg-white py-0 pl-4 pr-10 text-sm text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                    >
                      <option value="all">{isArabic ? 'كل الخطوط' : 'All lines'}</option>
                      {lineOptions.map((option) => (
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
                <label htmlFor="shop-all-size" className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-label">
                  {copy.search.sizeFilterLabel}
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
                    {copy.search.vibeLabel}
                  </label>
                  <div className="relative">
                    <select
                      id="shop-all-feeling"
                      value={feelingFilter}
                      onChange={(event) => updateParams({ feelingFilter: event.target.value, vibeFilter: null })}
                      className="min-h-12 w-full appearance-none rounded-sm border border-stone bg-white py-0 pl-4 pr-10 text-sm text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                    >
                      <option value="all">{copy.search.allVibesLabel}</option>
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
                    {copy.search.artistLabel}
                  </label>
                  <div className="relative">
                    <select
                      id="shop-all-artist"
                      value={filterArtist}
                      onChange={(event) => updateParams({ fArtist: event.target.value })}
                      className="min-h-12 w-full appearance-none rounded-sm border border-stone bg-white py-0 pl-4 pr-10 text-sm text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                    >
                      <option value="all">{copy.search.allArtistsLabel}</option>
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
                    {copy.search.occasionFilterLabel}
                  </label>
                  <div className="relative">
                    <select
                      id="shop-all-occasion"
                      value={filterOccasion}
                      onChange={(event) => updateParams({ fOccasion: event.target.value })}
                      className="min-h-12 w-full appearance-none rounded-sm border border-stone bg-white py-0 pl-4 pr-10 text-sm text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                    >
                      <option value="all">{copy.search.allOccasionsFilterLabel}</option>
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
                    {copy.search.colorLabel}
                  </label>
                  <div className="relative">
                    <select
                      id="shop-all-color"
                      value={filterColor}
                      onChange={(event) => updateParams({ fColor: event.target.value })}
                      className="min-h-12 w-full appearance-none rounded-sm border border-stone bg-white py-0 pl-4 pr-10 text-sm text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                    >
                      <option value="all">{copy.search.allColorsLabel}</option>
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

          {useMedusaServerBrowse && medusaBrowseStatus === 'loading' && results.designMatches.length === 0 ? (
            <SkeletonGrid count={6} />
          ) : filteredDesignMatches.length > 0 ? (
            <>
            <div className="vibe-product-grid">
              {pagedDesignMatches.map((product, index) => (
                <ShopAllProductCard
                  key={product.slug}
                  product={product}
                  onQuickView={setQuickViewSlug}
                  eager={index < 6}
                />
              ))}
            </div>
            {totalPages > 1 ? (
              <nav className="mt-10 flex flex-wrap items-center justify-center gap-3" aria-label={isArabic ? 'صفحات' : 'Pagination'}>
                <button
                  type="button"
                  className="btn btn-secondary min-h-11"
                  disabled={currentPage <= 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  {isArabic ? 'السابق' : 'Previous'}
                </button>
                <span className="font-body text-sm text-warm-charcoal">
                  {isArabic ? `صفحة ${currentPage} من ${totalPages}` : `Page ${currentPage} of ${totalPages}`}
                </span>
                <button
                  type="button"
                  className="btn btn-secondary min-h-11"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage(currentPage + 1)}
                >
                  {isArabic ? 'التالي' : 'Next'}
                </button>
              </nav>
            ) : null}
            </>
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
                  {copy.search.resetFiltersCta}
                </button>
                <Link className="btn btn-secondary text-sm" href="/feelings">
                  {isArabic ? 'تصفّح المشاعر' : 'Browse feelings'}
                </Link>
                <Link className="btn btn-ghost" href="/occasions">
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
                    {copy.search.filterAndSortCta}
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
                    {copy.search.sortLabel}
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
                    {copy.search.priceLabel}
                  </label>
                  <div className="relative">
                    <select
                      id="mobile-shop-all-price"
                      value={priceFilter}
                      onChange={(event) => updateParams({ price: event.target.value })}
                      className="min-h-12 w-full appearance-none rounded-sm border border-stone bg-white py-0 pl-4 pr-10 text-sm text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                    >
                      {priceOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronIcon />
                  </div>
                </div>

                {lineOptions.length > 1 ? (
                  <div className="flex flex-col gap-2">
                    <label htmlFor="mobile-shop-all-line" className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-label">
                      {isArabic ? 'الخط' : 'Line'}
                    </label>
                    <div className="relative">
                      <select
                        id="mobile-shop-all-line"
                        value={lineFilter}
                        onChange={(event) => updateParams({ line: event.target.value })}
                        className="min-h-12 w-full appearance-none rounded-sm border border-stone bg-white py-0 pl-4 pr-10 text-sm text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                      >
                        <option value="all">{isArabic ? 'كل الخطوط' : 'All lines'}</option>
                        {lineOptions.map((option) => (
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
                  <label htmlFor="mobile-shop-all-size" className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-label">
                    {copy.search.sizeFilterLabel}
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
                      {copy.search.vibeLabel}
                    </label>
                    <div className="relative">
                      <select
                        id="mobile-shop-all-feeling"
                        value={feelingFilter}
                        onChange={(event) => updateParams({ feelingFilter: event.target.value, vibeFilter: null })}
                        className="min-h-12 w-full appearance-none rounded-sm border border-stone bg-white py-0 pl-4 pr-10 text-sm text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                      >
                        <option value="all">{copy.search.allVibesLabel}</option>
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
                      {copy.search.artistLabel}
                    </label>
                    <div className="relative">
                      <select
                        id="mobile-shop-all-artist"
                        value={filterArtist}
                        onChange={(event) => updateParams({ fArtist: event.target.value })}
                        className="min-h-12 w-full appearance-none rounded-sm border border-stone bg-white py-0 pl-4 pr-10 text-sm text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                      >
                        <option value="all">{copy.search.allArtistsLabel}</option>
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
                      {copy.search.occasionFilterLabel}
                    </label>
                    <div className="relative">
                      <select
                        id="mobile-shop-all-occasion"
                        value={filterOccasion}
                        onChange={(event) => updateParams({ fOccasion: event.target.value })}
                        className="min-h-12 w-full appearance-none rounded-sm border border-stone bg-white py-0 pl-4 pr-10 text-sm text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                      >
                        <option value="all">{copy.search.allOccasionsFilterLabel}</option>
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
                      {copy.search.colorLabel}
                    </label>
                    <div className="relative">
                      <select
                        id="mobile-shop-all-color"
                        value={filterColor}
                        onChange={(event) => updateParams({ fColor: event.target.value })}
                        className="min-h-12 w-full appearance-none rounded-sm border border-stone bg-white py-0 pl-4 pr-10 text-sm text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                      >
                        <option value="all">{copy.search.allColorsLabel}</option>
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
                    {copy.search.resetFiltersCta}
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

      <ExitIntentModal surface="plp" />
    </div>
  );
}
