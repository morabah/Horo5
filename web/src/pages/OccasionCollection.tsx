import { Link, useParams } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ProductQuickView } from '../components/ProductQuickView';
import { TeeImageFrame } from '../components/TeeImage';
import { OCCASION_SCHEMA } from '../data/domain-config';
import { getProductMedia, giftWrapPreview, imgUrl } from '../data/images';
import { getArtist, getOccasion, getVibe, occasions, productsByOccasion, type OccasionSlug, type Product } from '../data/site';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { formatEgp } from '../utils/formatPrice';
import { sortProductList, type ProductSortKey } from '../utils/productSort';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const SORT_OPTIONS: { value: ProductSortKey; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
];

type PriceFilter = 'all' | 'under-800' | '800-899' | '900+';

const PRICE_FILTERS: { value: PriceFilter; label: string }[] = [
  { value: 'all', label: OCCASION_SCHEMA.copy.allPricesLabel },
  { value: 'under-800', label: OCCASION_SCHEMA.copy.under800Label },
  { value: '800-899', label: OCCASION_SCHEMA.copy.between800And899Label },
  { value: '900+', label: OCCASION_SCHEMA.copy.over900Label },
];

function filterByPrice(list: Product[], filter: PriceFilter) {
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

function formatDesignCount(count: number) {
  return `${count} ${count === 1 ? OCCASION_SCHEMA.copy.designSingular : OCCASION_SCHEMA.copy.designPlural}`;
}

function OccasionProductCard({
  product,
  isGiftOccasion,
  isMobile,
  onQuickView,
}: {
  product: Product;
  isGiftOccasion: boolean;
  isMobile: boolean;
  onQuickView: (slug: string) => void;
}) {
  const vibe = getVibe(product.vibeSlug);
  const artist = getArtist(product.artistSlug);
  const { main } = getProductMedia(product.slug);

  return (
    <article className="group flex flex-col">
      <div className="relative mb-4 w-full">
        <Link
          to={`/products/${product.slug}`}
          className="block overflow-hidden rounded-md bg-surface-container-high shadow-sm ring-1 ring-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
        >
          <div className="transition-transform duration-700 ease-out group-hover:scale-[1.03]">
            <TeeImageFrame
              src={main}
              alt={`HORO “${product.name}” graphic tee for ${vibe?.name ?? 'the collection'}.`}
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
            Quick view
          </button>
        ) : null}
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {artist ? <p className="font-body text-xs text-clay-earth">{artist.name}</p> : null}
          <Link
            to={`/products/${product.slug}`}
            className="font-headline mt-1 block text-[1.08rem] font-semibold leading-snug tracking-[0.01em] text-obsidian transition-colors hover:text-clay focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
          >
            {product.name}
          </Link>
          <p className="font-pdp-serif mt-2 text-[1.125rem] font-normal text-obsidian">{formatEgp(product.priceEgp)}</p>
          {isGiftOccasion ? (
            <p className="font-label mt-3 inline-flex min-h-9 items-center rounded-full border border-stone bg-white px-3 py-2 text-[10px] font-medium uppercase tracking-[0.18em] text-clay-earth shadow-sm">
              {OCCASION_SCHEMA.copy.giftBannerChip}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function OccasionCollection() {
  const { slug = '' } = useParams();
  const occasion = getOccasion(slug);
  const isMobile = useMediaQuery('(max-width: 767px)');

  const [sortKey, setSortKey] = useState<ProductSortKey>('featured');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all');
  const [vibeFilter, setVibeFilter] = useState<string>('all');
  const [artistSlug, setArtistSlug] = useState<string>('all');
  const [quickViewSlug, setQuickViewSlug] = useState<string | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const mobileFilterSheetRef = useRef<HTMLDivElement>(null);
  const mobileFilterCloseBtnRef = useRef<HTMLButtonElement>(null);
  const mobileFilterTriggerRef = useRef<HTMLElement | null>(null);

  const occasionSlug = occasion?.slug as OccasionSlug | undefined;
  const baseList = useMemo(() => (occasionSlug ? productsByOccasion(occasionSlug) : []), [occasionSlug]);

  useEffect(() => {
    setSortKey('featured');
    setPriceFilter('all');
    setVibeFilter('all');
    setArtistSlug('all');
    setMobileFiltersOpen(false);
  }, [slug]);

  useEffect(() => {
    if (!isMobile) {
      setMobileFiltersOpen(false);
    }
  }, [isMobile]);

  const artistOptions = useMemo(() => {
    return [...new Set(baseList.map((product) => product.artistSlug))].sort();
  }, [baseList]);

  const vibeOptions = useMemo(() => {
    return [...new Set(baseList.map((product) => product.vibeSlug))].sort();
  }, [baseList]);

  const sorted = useMemo(() => sortProductList(baseList, sortKey), [baseList, sortKey]);

  const list = useMemo(() => {
    let next = filterByPrice(sorted, priceFilter);
    if (vibeFilter !== 'all') next = next.filter((product) => product.vibeSlug === vibeFilter);
    if (artistSlug !== 'all') next = next.filter((product) => product.artistSlug === artistSlug);
    return next;
  }, [artistSlug, priceFilter, sorted, vibeFilter]);

  const hasActiveFilters = sortKey !== 'featured' || priceFilter !== 'all' || vibeFilter !== 'all' || artistSlug !== 'all';

  const siblingOccasions = useMemo(() => {
    return occasions.filter((entry) => entry.slug !== slug);
  }, [slug]);

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

  if (!occasion) {
    return (
      <div className="container py-12">
        <p className="font-body text-warm-charcoal">{OCCASION_SCHEMA.copy.notFoundTitle}</p>
        <Link to="/occasions" className="font-label mt-4 inline-block text-deep-teal underline">
          {OCCASION_SCHEMA.copy.backToOccasionsCta}
        </Link>
      </div>
    );
  }

  const scopeSearchTo = `/search?occasion=${encodeURIComponent(occasion.slug)}&focus=1`;

  return (
    <div className="bg-papyrus pb-16 md:pb-20">
      <a
        href="#occasion-collection-products"
        className="sr-only left-4 top-[max(0.75rem,env(safe-area-inset-top))] z-250 rounded-sm border border-outline-variant/50 bg-papyrus px-4 py-3 font-label text-[11px] font-semibold uppercase tracking-widest text-obsidian shadow-md outline-none ring-deep-teal focus:not-sr-only focus:fixed focus:ring-2"
      >
        Skip to collection
      </a>

      <section className="relative isolate overflow-hidden bg-obsidian text-white" aria-labelledby="occasion-collection-title">
        <div className="relative h-[42vh] min-h-[22rem] sm:h-[46vh] md:h-[52vh] md:min-h-[30rem]">
          <img
            alt={occasion.heroImageAlt}
            className="absolute inset-0 h-full w-full object-cover object-center"
            src={imgUrl(occasion.heroImageSrc, 1600)}
            width={1600}
            height={1200}
            decoding="async"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(18,18,18,0.24)_0%,rgba(18,18,18,0.44)_46%,rgba(18,18,18,0.88)_100%)]"
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-0">
            <div className="mx-auto max-w-7xl px-6 pb-8 md:px-10 md:pb-12">
              <div className="max-w-2xl">
                <nav className="font-body mb-4 text-[13px] text-white/76 md:text-sm" aria-label={OCCASION_SCHEMA.copy.breadcrumbLabel}>
                  <Link to="/" className="transition-colors hover:text-white">
                    Home
                  </Link>
                  <span className="text-white/42" aria-hidden>
                    {' '}
                    /{' '}
                  </span>
                  <Link to="/occasions" className="transition-colors hover:text-white">
                    Occasions
                  </Link>
                  <span className="text-white/42" aria-hidden>
                    {' '}
                    /{' '}
                  </span>
                  <span className="text-white">{occasion.name}</span>
                </nav>
                <h1
                  id="occasion-collection-title"
                  className="font-headline text-[clamp(2.3rem,5vw,4.3rem)] font-semibold leading-[0.94] tracking-tight text-white"
                >
                  {occasion.name}
                </h1>
                <p className="font-body mt-4 max-w-xl text-base leading-relaxed text-white/88 md:text-[1.0625rem]">
                  {occasion.blurb}
                </p>
                <p className="font-label mt-5 text-[10px] font-medium uppercase tracking-[0.24em] text-white/78 md:text-[11px]">
                  {formatDesignCount(baseList.length)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-12 px-6 pt-8 pb-12 md:space-y-14 md:px-10 md:pt-10 md:pb-16">
        {occasion.isGiftOccasion ? (
          <section className="card-glass grid gap-5 overflow-hidden border border-[rgba(212,164,78,0.22)] bg-[linear-gradient(135deg,rgba(255,245,230,0.98),rgba(255,255,255,0.82))] p-4 md:grid-cols-[minmax(11rem,13rem)_minmax(0,1fr)] md:items-center md:p-5">
            <div className="overflow-hidden rounded-[18px] border border-stone/60 bg-white/80">
              <img
                src={giftWrapPreview}
                alt="Preview of the HORO story card and gift wrap add-on."
                className="block h-full w-full object-cover"
                width={960}
                height={720}
              />
            </div>
            <div className="min-w-0">
              <h2 className="font-headline text-xl font-semibold leading-tight text-obsidian">{OCCASION_SCHEMA.copy.giftBannerHeading}</h2>
              <p className="mt-3 font-body text-[0.96rem] leading-relaxed text-warm-charcoal">{OCCASION_SCHEMA.copy.giftBannerBody}</p>
              <p className="font-label mt-4 inline-flex min-h-9 items-center rounded-full border border-stone bg-white px-3 py-2 text-[10px] font-medium uppercase tracking-[0.18em] text-clay-earth shadow-sm">
                {OCCASION_SCHEMA.copy.giftBannerChip}
              </p>
            </div>
          </section>
        ) : null}

        <section id="occasion-collection-products" className="scroll-mt-[calc(5.5rem+env(safe-area-inset-top,0px))]">
          {isMobile ? (
            <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-stone/30 pb-4">
              <button
                type="button"
                onClick={openMobileFilters}
                className="font-label inline-flex min-h-12 items-center justify-center rounded-sm border border-stone bg-white px-5 py-3 text-[11px] font-medium uppercase tracking-[0.2em] text-obsidian shadow-sm transition-colors hover:border-desert-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
              >
                {OCCASION_SCHEMA.copy.filterAndSortCta}
              </button>
              <Link
                to={scopeSearchTo}
                className="link-underline-reveal font-label inline-flex min-h-12 items-center text-[11px] font-medium uppercase tracking-[0.2em] text-deep-teal"
              >
                {OCCASION_SCHEMA.copy.searchThisOccasionCta}
              </Link>
            </div>
          ) : (
            <div className="sticky top-[calc(5.5rem+env(safe-area-inset-top,0px))] z-20 mb-8 flex items-end justify-between gap-6 border-b border-stone/30 bg-papyrus/95 pb-4 backdrop-blur-sm">
              <div className="flex min-w-0 flex-wrap items-end gap-4">
                <div className="flex min-w-[13rem] flex-col gap-2">
                  <label htmlFor="occasion-sort" className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-label">
                    {OCCASION_SCHEMA.copy.sortLabel}
                  </label>
                  <div className="relative inline-block min-w-0">
                    <select
                      id="occasion-sort"
                      value={sortKey}
                      onChange={(event) => setSortKey(event.target.value as ProductSortKey)}
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
                  <label htmlFor="occasion-price" className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-label">
                    {OCCASION_SCHEMA.copy.priceLabel}
                  </label>
                  <div className="relative inline-block min-w-0">
                    <select
                      id="occasion-price"
                      value={priceFilter}
                      onChange={(event) => setPriceFilter(event.target.value as PriceFilter)}
                      className="min-h-12 w-full appearance-none rounded-sm border border-stone bg-white py-0 pl-4 pr-10 text-sm text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                    >
                      {PRICE_FILTERS.map((option) => (
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
                    <label htmlFor="occasion-vibe" className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-label">
                      {OCCASION_SCHEMA.copy.vibeLabel}
                    </label>
                    <div className="relative inline-block min-w-0">
                      <select
                        id="occasion-vibe"
                        value={vibeFilter}
                        onChange={(event) => setVibeFilter(event.target.value)}
                        className="min-h-12 w-full appearance-none rounded-sm border border-stone bg-white py-0 pl-4 pr-10 text-sm text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                      >
                        <option value="all">{OCCASION_SCHEMA.copy.allVibesLabel}</option>
                        {vibeOptions.map((vibeSlug) => {
                          const vibe = getVibe(vibeSlug);
                          return (
                            <option key={vibeSlug} value={vibeSlug}>
                              {vibe?.name ?? vibeSlug}
                            </option>
                          );
                        })}
                      </select>
                      <ChevronIcon />
                    </div>
                  </div>
                ) : null}

                {artistOptions.length > 1 ? (
                  <div className="flex min-w-[13rem] flex-col gap-2">
                    <label htmlFor="occasion-artist" className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-label">
                      {OCCASION_SCHEMA.copy.artistLabel}
                    </label>
                    <div className="relative inline-block min-w-0">
                      <select
                        id="occasion-artist"
                        value={artistSlug}
                        onChange={(event) => setArtistSlug(event.target.value)}
                        className="min-h-12 w-full appearance-none rounded-sm border border-stone bg-white py-0 pl-4 pr-10 text-sm text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                      >
                        <option value="all">{OCCASION_SCHEMA.copy.allArtistsLabel}</option>
                        {artistOptions.map((currentArtistSlug) => {
                          const artist = getArtist(currentArtistSlug);
                          return (
                            <option key={currentArtistSlug} value={currentArtistSlug}>
                              {artist?.name ?? currentArtistSlug}
                            </option>
                          );
                        })}
                      </select>
                      <ChevronIcon />
                    </div>
                  </div>
                ) : null}
              </div>

              <Link
                to={scopeSearchTo}
                className="link-underline-reveal font-label inline-flex min-h-12 shrink-0 items-center text-[11px] font-medium uppercase tracking-[0.2em] text-deep-teal"
              >
                {OCCASION_SCHEMA.copy.searchThisOccasionCta}
              </Link>
            </div>
          )}

          <div className="vibe-product-grid">
            {list.map((product) => (
              <OccasionProductCard
                key={product.slug}
                product={product}
                isGiftOccasion={occasion.isGiftOccasion}
                isMobile={isMobile}
                onQuickView={setQuickViewSlug}
              />
            ))}
          </div>

          {list.length === 0 && hasActiveFilters ? (
            <p className="mt-6 font-body text-clay">
              {OCCASION_SCHEMA.copy.noFilteredResults}{' '}
              <button
                type="button"
                onClick={() => {
                  setSortKey('featured');
                  setPriceFilter('all');
                  setVibeFilter('all');
                  setArtistSlug('all');
                }}
                className="border-0 bg-transparent font-medium text-deep-teal underline"
              >
                {OCCASION_SCHEMA.copy.resetFiltersCta}
              </button>
            </p>
          ) : null}

          {list.length === 0 && !hasActiveFilters ? (
            <p className="mt-6 font-body text-warm-charcoal">{OCCASION_SCHEMA.copy.noOccasionResults}</p>
          ) : null}
        </section>

        <section aria-labelledby="more-occasions-title">
          <div className="mb-5 flex items-end justify-between gap-4">
            <h2 id="more-occasions-title" className="font-headline text-[1.4rem] font-semibold tracking-tight text-obsidian">
              {OCCASION_SCHEMA.copy.moreOccasionsHeading}
            </h2>
          </div>
          <div className="scroll-snap-carousel -mx-6 flex gap-4 overflow-x-auto px-6 pb-2 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0">
            {siblingOccasions.map((entry) => (
              <Link
                key={entry.slug}
                to={`/occasions/${entry.slug}`}
                className="group block min-w-[14rem] snap-start overflow-hidden rounded-[18px] border border-stone/70 bg-white/70 text-inherit no-underline shadow-[0_18px_44px_-28px_rgba(26,26,26,0.24)] transition-transform duration-300 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal md:min-w-0"
              >
                <TeeImageFrame src={entry.cardImageSrc} alt={entry.cardImageAlt} w={640} aspectRatio="4/5" borderRadius="0" />
                <div className="space-y-2 p-4">
                  <p className="font-headline text-lg font-semibold leading-snug text-obsidian">{entry.name}</p>
                  <p className="font-body text-sm leading-relaxed text-warm-charcoal">{entry.blurb}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {isMobile && mobileFiltersOpen && typeof document !== 'undefined'
        ? createPortal(
          <div className="fixed inset-0 z-[240] bg-black/55 backdrop-blur-sm" onClick={closeMobileFilters}>
            <div
              ref={mobileFilterSheetRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="mobile-occasion-filters-title"
              className="absolute inset-x-0 bottom-0 rounded-t-[1.5rem] bg-papyrus px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-5 shadow-[0_-24px_64px_-24px_rgba(0,0,0,0.38)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-label text-[10px] font-medium uppercase tracking-[0.24em] text-label">{occasion.name}</p>
                  <h2 id="mobile-occasion-filters-title" className="font-headline mt-2 text-2xl font-semibold tracking-tight text-obsidian">
                    {OCCASION_SCHEMA.copy.filterAndSortCta}
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
                  <label htmlFor="mobile-occasion-sort" className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-label">
                    {OCCASION_SCHEMA.copy.sortLabel}
                  </label>
                  <div className="relative">
                    <select
                      id="mobile-occasion-sort"
                      value={sortKey}
                      onChange={(event) => setSortKey(event.target.value as ProductSortKey)}
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
                  <label htmlFor="mobile-occasion-price" className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-label">
                    {OCCASION_SCHEMA.copy.priceLabel}
                  </label>
                  <div className="relative">
                    <select
                      id="mobile-occasion-price"
                      value={priceFilter}
                      onChange={(event) => setPriceFilter(event.target.value as PriceFilter)}
                      className="min-h-12 w-full appearance-none rounded-sm border border-stone bg-white py-0 pl-4 pr-10 text-sm text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                    >
                      {PRICE_FILTERS.map((option) => (
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
                    <label htmlFor="mobile-occasion-vibe" className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-label">
                      {OCCASION_SCHEMA.copy.vibeLabel}
                    </label>
                    <div className="relative">
                      <select
                        id="mobile-occasion-vibe"
                        value={vibeFilter}
                        onChange={(event) => setVibeFilter(event.target.value)}
                        className="min-h-12 w-full appearance-none rounded-sm border border-stone bg-white py-0 pl-4 pr-10 text-sm text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                      >
                        <option value="all">{OCCASION_SCHEMA.copy.allVibesLabel}</option>
                        {vibeOptions.map((vibeSlug) => {
                          const vibe = getVibe(vibeSlug);
                          return (
                            <option key={vibeSlug} value={vibeSlug}>
                              {vibe?.name ?? vibeSlug}
                            </option>
                          );
                        })}
                      </select>
                      <ChevronIcon />
                    </div>
                  </div>
                ) : null}

                {artistOptions.length > 1 ? (
                  <div className="flex flex-col gap-2">
                    <label htmlFor="mobile-occasion-artist" className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-label">
                      {OCCASION_SCHEMA.copy.artistLabel}
                    </label>
                    <div className="relative">
                      <select
                        id="mobile-occasion-artist"
                        value={artistSlug}
                        onChange={(event) => setArtistSlug(event.target.value)}
                        className="min-h-12 w-full appearance-none rounded-sm border border-stone bg-white py-0 pl-4 pr-10 text-sm text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                      >
                        <option value="all">{OCCASION_SCHEMA.copy.allArtistsLabel}</option>
                        {artistOptions.map((currentArtistSlug) => {
                          const artist = getArtist(currentArtistSlug);
                          return (
                            <option key={currentArtistSlug} value={currentArtistSlug}>
                              {artist?.name ?? currentArtistSlug}
                            </option>
                          );
                        })}
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
                  {OCCASION_SCHEMA.copy.showCountCta
                    .replace('{count}', String(list.length))
                    .replace('{label}', list.length === 1 ? OCCASION_SCHEMA.copy.designSingular : OCCASION_SCHEMA.copy.designPlural)}
                </button>
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSortKey('featured');
                      setPriceFilter('all');
                      setVibeFilter('all');
                      setArtistSlug('all');
                    }}
                    className="font-label inline-flex min-h-11 items-center justify-center rounded-sm border border-stone bg-white px-6 py-3 text-[11px] font-medium uppercase tracking-[0.2em] text-obsidian shadow-sm transition-colors hover:border-desert-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                  >
                    {OCCASION_SCHEMA.copy.resetFiltersCta}
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
