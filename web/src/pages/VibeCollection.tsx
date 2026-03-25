import { Link, useParams } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getEditorialBlockByVibeSlug } from '../data/homeEditorial';
import { getArtist, getVibe, productsByVibe, vibes } from '../data/site';
import { getProductMedia, heroStreet, imgUrl, vibeCovers } from '../data/images';
import { TeeImageFrame } from '../components/TeeImage';
import { formatEgp } from '../utils/formatPrice';
import { sortProductList, type ProductSortKey } from '../utils/productSort';
import { ProductQuickView } from '../components/ProductQuickView';
import { useMediaQuery } from '../hooks/useMediaQuery';

/** Show numeric design count in hero only when catalog feels substantial */
const DESIGN_COUNT_MIN = 4;
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
  { value: 'all', label: 'All prices' },
  { value: 'under-800', label: 'Under 800 EGP' },
  { value: '800-899', label: '800–899 EGP' },
  { value: '900+', label: '900+ EGP' },
];

function filterByPrice(list: import('../data/site').Product[], filter: PriceFilter) {
  switch (filter) {
    case 'under-800': return list.filter((p) => p.priceEgp < 800);
    case '800-899': return list.filter((p) => p.priceEgp >= 800 && p.priceEgp < 900);
    case '900+': return list.filter((p) => p.priceEgp >= 900);
    default: return list;
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
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((el) => {
    if (el.hasAttribute('disabled')) return false;
    if (el.getAttribute('aria-hidden') === 'true') return false;
    if (el.tabIndex < 0 && el.tagName !== 'A' && el.tagName !== 'BUTTON') return false;
    return true;
  });
}

export function VibeCollection() {
  const { slug = '' } = useParams();
  const vibe = getVibe(slug);
  const baseList = productsByVibe(slug);
  const [sortKey, setSortKey] = useState<ProductSortKey>('featured');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all');
  const [artistSlug, setArtistSlug] = useState<string>('all');
  const [quickViewSlug, setQuickViewSlug] = useState<string | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 767px)');
  const mobileFilterSheetRef = useRef<HTMLDivElement>(null);
  const mobileFilterCloseBtnRef = useRef<HTMLButtonElement>(null);
  const mobileFilterTriggerRef = useRef<HTMLElement | null>(null);

  const editorialBlock = useMemo(() => getEditorialBlockByVibeSlug(slug), [slug]);

  useEffect(() => {
    setSortKey('featured');
    setPriceFilter('all');
    setArtistSlug('all');
    setMobileFiltersOpen(false);
  }, [slug]);

  useEffect(() => {
    if (!isMobile) {
      setMobileFiltersOpen(false);
    }
  }, [isMobile]);

  const artistOptions = useMemo(() => {
    const slugs = [...new Set(baseList.map((p) => p.artistSlug))];
    return slugs.sort();
  }, [baseList]);

  const sorted = useMemo(() => sortProductList(baseList, sortKey), [baseList, sortKey]);
  const list = useMemo(() => {
    let next = filterByPrice(sorted, priceFilter);
    if (artistSlug !== 'all') next = next.filter((p) => p.artistSlug === artistSlug);
    return next;
  }, [sorted, priceFilter, artistSlug]);

  const others = vibes.filter((v) => v.slug !== slug).slice(0, 4);

  if (!vibe) {
    return (
      <div className="container py-12">
        <p className="font-body text-warm-charcoal">Vibe not found.</p>
        <Link to="/vibes" className="font-label mt-4 inline-block text-deep-teal underline">
          Back to vibes
        </Link>
      </div>
    );
  }

  const heroCover = vibeCovers[vibe.slug] ?? heroStreet;
  const storyImageSrc = editorialBlock?.wideSrc ?? heroCover;
  const storyImageAlt = editorialBlock?.wideAlt ?? `${vibe.name} collection — model in HORO graphic tee`;
  const storyLead = editorialBlock?.body ?? vibe.tagline;
  const manifestoLine = editorialBlock?.manifesto ?? vibe.manifesto;
  const designCountLabel = baseList.length >= DESIGN_COUNT_MIN ? `${baseList.length} designs` : 'Curated selection';
  const hasActiveFilters = sortKey !== 'featured' || priceFilter !== 'all' || artistSlug !== 'all';

  const closeMobileFilters = useCallback(() => {
    setMobileFiltersOpen(false);
  }, []);

  const openMobileFilters = useCallback(() => {
    mobileFilterTriggerRef.current = document.activeElement as HTMLElement | null;
    setMobileFiltersOpen(true);
  }, []);

  useEffect(() => {
    if (!mobileFiltersOpen) {
      const el = mobileFilterTriggerRef.current;
      mobileFilterTriggerRef.current = null;
      el?.focus();
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobileFilters();
    };
    window.addEventListener('keydown', onKey);
    const id = requestAnimationFrame(() => {
      mobileFilterCloseBtnRef.current?.focus();
    });
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
      cancelAnimationFrame(id);
    };
  }, [mobileFiltersOpen, closeMobileFilters]);

  useEffect(() => {
    if (!mobileFiltersOpen) return;
    const panel = mobileFilterSheetRef.current;
    if (!panel) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const nodes = getFocusableElements(panel);
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    panel.addEventListener('keydown', onKeyDown);
    return () => panel.removeEventListener('keydown', onKeyDown);
  }, [mobileFiltersOpen]);

  return (
    <div className="bg-papyrus pb-16 md:pb-20">
      <a
        href="#vibe-collection-products"
        className="sr-only left-4 top-[max(0.75rem,env(safe-area-inset-top))] z-250 rounded-sm border border-outline-variant/50 bg-papyrus px-4 py-3 font-label text-[11px] font-semibold uppercase tracking-widest text-obsidian shadow-md outline-none ring-deep-teal focus:not-sr-only focus:fixed focus:ring-2"
      >
        Skip to collection
      </a>

      <section className="relative isolate overflow-hidden bg-obsidian text-white" aria-labelledby="vibe-collection-title">
        <div className="relative h-[44vh] min-h-[24rem] sm:h-[48vh] md:h-[56vh] md:min-h-[32rem] lg:h-[60vh]">
          <img
            alt={`${vibe.name} vibe — HORO lookbook`}
            className="absolute inset-0 h-full w-full object-cover object-[center_24%]"
            src={imgUrl(heroCover, 1600)}
            width={1600}
            height={1200}
            decoding="async"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(18,18,18,0.26)_0%,rgba(18,18,18,0.46)_46%,rgba(18,18,18,0.88)_100%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{ background: `linear-gradient(135deg, ${vibe.accent}66, transparent 42%)` }}
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-0">
            <div className="mx-auto max-w-7xl px-6 pb-8 md:px-10 md:pb-12 lg:pb-14">
              <div className="max-w-2xl">
                <nav className="font-body mb-4 text-[13px] text-white/76 md:mb-5 md:text-sm" aria-label="Breadcrumb">
                  <Link to="/" className="transition-colors hover:text-white">
                    Home
                  </Link>
                  <span className="text-white/42" aria-hidden>
                    {' '}
                    /{' '}
                  </span>
                  <Link to="/vibes" className="transition-colors hover:text-white">
                    Vibes
                  </Link>
                  <span className="text-white/42" aria-hidden>
                    {' '}
                    /{' '}
                  </span>
                  <span className="text-white">{vibe.name}</span>
                </nav>
                <p className="font-label mb-3 text-[10px] font-medium uppercase tracking-[0.28em] text-white/78 md:text-[11px]">
                  {designCountLabel}
                </p>
                <h1
                  id="vibe-collection-title"
                  className="font-headline text-[clamp(2.4rem,6vw,4.9rem)] font-semibold leading-[0.94] tracking-tight text-white"
                >
                  {vibe.name}
                </h1>
                <p className="font-body mt-4 max-w-xl text-base leading-relaxed text-white/88 md:text-[1.0625rem]">
                  {vibe.tagline}
                </p>
                {manifestoLine ? (
                  <p className="font-pdp-serif mt-5 max-w-xl text-[1.125rem] italic leading-relaxed text-white/92 md:text-[1.3rem]">
                    &ldquo;{manifestoLine}&rdquo;
                  </p>
                ) : null}
                <div className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                  <a
                    href="#vibe-collection-products"
                    className="font-label inline-flex min-h-12 items-center justify-center rounded-sm bg-primary px-8 py-3 text-sm font-medium uppercase tracking-[0.2em] text-obsidian shadow-[0_18px_38px_-18px_rgba(0,0,0,0.72)] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    Shop the designs
                  </a>
                  <a
                    href="#vibe-story"
                    className="link-underline-reveal font-label inline-flex min-h-11 items-center text-[11px] font-medium uppercase tracking-[0.2em] text-white/86 hover:text-white"
                  >
                    Read the story
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-14 px-6 pt-8 pb-12 md:space-y-16 md:px-10 md:pt-10 md:pb-16">
        <section id="vibe-collection-products" className="scroll-mt-[calc(5.5rem+env(safe-area-inset-top,0px))]">
          {isMobile ? (
            <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-stone/30 pb-4">
              <button
                type="button"
                onClick={openMobileFilters}
                className="font-label inline-flex min-h-12 items-center justify-center rounded-sm border border-stone bg-white px-5 py-3 text-[11px] font-medium uppercase tracking-[0.2em] text-obsidian shadow-sm transition-colors hover:border-desert-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
              >
                Filter &amp; sort
              </button>
              <Link
                to={`/search?vibe=${encodeURIComponent(slug)}&focus=1`}
                className="link-underline-reveal font-label inline-flex min-h-12 items-center text-[11px] font-medium uppercase tracking-[0.2em] text-deep-teal"
              >
                Search this vibe
              </Link>
            </div>
          ) : (
            <div
              className="sticky top-[calc(5.5rem+env(safe-area-inset-top,0px))] z-20 mb-8 flex items-end justify-between gap-6 border-b border-stone/30 bg-papyrus/95 pb-4 backdrop-blur-sm"
            >
              <div className="flex min-w-0 flex-wrap items-end gap-4">
                <div className="flex min-w-[13rem] flex-col gap-2">
                  <label htmlFor="vibe-sort" className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-label">
                    Sort
                  </label>
                  <div className="relative inline-block min-w-0">
                    <select
                      id="vibe-sort"
                      value={sortKey}
                      onChange={(e) => setSortKey(e.target.value as ProductSortKey)}
                      className="min-h-12 w-full appearance-none rounded-sm border border-stone bg-white py-0 pl-4 pr-10 text-sm text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                    >
                      {SORT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <ChevronIcon />
                  </div>
                </div>

                <div className="flex min-w-[13rem] flex-col gap-2">
                  <label htmlFor="vibe-price" className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-label">
                    Price
                  </label>
                  <div className="relative inline-block min-w-0">
                    <select
                      id="vibe-price"
                      value={priceFilter}
                      onChange={(e) => setPriceFilter(e.target.value as PriceFilter)}
                      className="min-h-12 w-full appearance-none rounded-sm border border-stone bg-white py-0 pl-4 pr-10 text-sm text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                    >
                      {PRICE_FILTERS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <ChevronIcon />
                  </div>
                </div>

                {artistOptions.length > 1 ? (
                  <div className="flex min-w-[13rem] flex-col gap-2">
                    <label htmlFor="vibe-artist" className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-label">
                      Artist
                    </label>
                    <div className="relative inline-block min-w-0">
                      <select
                        id="vibe-artist"
                        value={artistSlug}
                        onChange={(e) => setArtistSlug(e.target.value)}
                        className="min-h-12 w-full appearance-none rounded-sm border border-stone bg-white py-0 pl-4 pr-10 text-sm text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                      >
                        <option value="all">All artists</option>
                        {artistOptions.map((aSlug) => {
                          const a = getArtist(aSlug);
                          return (
                            <option key={aSlug} value={aSlug}>
                              {a?.name ?? aSlug}
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
                to={`/search?vibe=${encodeURIComponent(slug)}&focus=1`}
                className="link-underline-reveal font-label inline-flex min-h-12 shrink-0 items-center text-[11px] font-medium uppercase tracking-[0.2em] text-deep-teal"
              >
                Search this vibe
              </Link>
            </div>
          )}

          <div className="vibe-product-grid">
            {list.map((p) => {
              const { main } = getProductMedia(p.slug);
              return (
                <article
                  key={p.slug}
                  className="group flex flex-col"
                >
                  <div className="relative mb-4 w-full">
                    <Link
                      to={`/products/${p.slug}`}
                      className="block overflow-hidden rounded-md bg-surface-container-high shadow-sm ring-1 ring-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                    >
                      <div className="transition-transform duration-700 ease-out group-hover:scale-[1.03]">
                        <TeeImageFrame
                          src={main}
                          alt={`HORO “${p.name}” graphic tee`}
                          w={700}
                          aspectRatio="4/5"
                          borderRadius="0.375rem"
                          frameStyle={{ marginBottom: 0 }}
                        />
                      </div>
                      {p.merchandisingBadge ? (
                        <span className="font-label absolute left-3 top-3 z-10 rounded-sm border border-white/70 bg-white/78 px-3 py-2 text-[10px] font-medium uppercase tracking-[0.18em] text-obsidian shadow-sm backdrop-blur-sm">
                          {p.merchandisingBadge}
                        </span>
                      ) : null}
                    </Link>
                    {!isMobile ? (
                      <button
                        type="button"
                        className="quick-view-pill quick-view-pill--hover font-label absolute bottom-3 left-3 right-3 z-10 min-h-12 rounded-full px-4 py-3 text-center text-xs font-medium uppercase tracking-[0.2em] text-obsidian transition-shadow hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                        onClick={() => setQuickViewSlug(p.slug)}
                        aria-label={`Quick view: ${p.name}`}
                      >
                        Quick view
                      </button>
                    ) : null}
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/products/${p.slug}`}
                        className="font-headline block text-[1.08rem] font-semibold leading-snug tracking-[0.01em] text-obsidian transition-colors hover:text-clay focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                      >
                        {p.name}
                      </Link>
                      <p className="font-pdp-serif mt-2 text-[1.125rem] font-normal text-obsidian">
                        {formatEgp(p.priceEgp)}
                      </p>
                    </div>
                    {isMobile ? (
                      <button
                        type="button"
                        className="font-label inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-stone bg-white px-4 py-2 text-[10px] font-medium uppercase tracking-[0.18em] text-obsidian shadow-sm transition-colors hover:border-desert-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                        onClick={() => setQuickViewSlug(p.slug)}
                        aria-label={`Quick view: ${p.name}`}
                      >
                        Quick view
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>

          {list.length === 0 && (priceFilter !== 'all' || artistSlug !== 'all') && (
            <p className="mt-6 font-body text-clay">
              No designs match these filters.{` `}
              <button
                type="button"
                onClick={() => {
                  setSortKey('featured');
                  setPriceFilter('all');
                  setArtistSlug('all');
                }}
                className="border-0 bg-transparent font-medium text-deep-teal underline"
              >
                Show all
              </button>
            </p>
          )}

          {list.length === 0 && priceFilter === 'all' && artistSlug === 'all' && (
            <p className="mt-6 font-body text-warm-charcoal">No designs in this vibe yet.</p>
          )}
        </section>

        <section
          id="vibe-story"
          className="scroll-mt-[calc(5.5rem+env(safe-area-inset-top,0px))] border-t border-stone/25 pt-12 md:pt-14"
          aria-labelledby="vibe-story-heading"
        >
          <div className="grid items-center gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:gap-12 lg:gap-16">
            <div className="w-full">
              <div className="editorial-shadow overflow-hidden rounded-sm shadow-2xl ring-1 ring-black/5">
                <img
                  alt={storyImageAlt}
                  className="h-auto w-full object-cover"
                  src={imgUrl(storyImageSrc, 1200)}
                  width={1200}
                  height={900}
                  loading="lazy"
                />
              </div>
            </div>
            <div className="w-full space-y-4 md:max-w-lg">
              {editorialBlock ? (
                <h2 id="vibe-story-heading" className="font-label text-[11px] font-medium uppercase tracking-[0.24em] text-label">
                  {editorialBlock.kicker}
                </h2>
              ) : (
                <h2 id="vibe-story-heading" className="font-headline text-xl font-semibold tracking-tight text-obsidian md:text-2xl">
                  {vibe.name}
                </h2>
              )}
              <p className="font-body text-[1.05rem] leading-relaxed text-warm-charcoal md:text-[1.16rem] md:leading-[1.75]">
                {storyLead}
              </p>
              <a
                href="#vibe-collection-products"
                className="font-label inline-flex min-h-12 items-center justify-center rounded-sm border border-stone bg-white px-7 py-3 text-sm font-medium uppercase tracking-[0.2em] text-obsidian shadow-sm transition-colors hover:border-desert-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
              >
                Back to the designs
              </a>
            </div>
          </div>
        </section>

        <section className="border-t border-stone/25 pt-12 md:pt-14">
          <h2 className="font-pdp-serif mb-8 text-center text-[clamp(1.18rem,2.4vw,1.7rem)] font-normal uppercase tracking-[0.24em] text-obsidian md:mb-10">
            Explore other vibes
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {others.map((v) => (
              <Link
                key={v.slug}
                to={`/vibes/${v.slug}`}
                className="group overflow-hidden rounded-sm border border-stone/70 bg-white text-inherit no-underline shadow-sm transition-transform hover:-translate-y-1 hover:border-desert-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
              >
                <div className="overflow-hidden">
                  <img
                    alt={`${v.name} vibe`}
                    className="aspect-[4/5] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    src={imgUrl(vibeCovers[v.slug] ?? heroStreet, 720)}
                    width={720}
                    height={900}
                  />
                </div>
                <div className="space-y-2 px-4 py-4">
                  <p className="font-headline text-lg font-semibold text-obsidian">{v.name}</p>
                  <p className="font-body text-sm leading-relaxed text-warm-charcoal">{v.tagline}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {isMobile && mobileFiltersOpen && typeof document !== 'undefined'
        ? createPortal(
          <div
            className="fixed inset-0 z-[240] bg-black/55 backdrop-blur-sm"
            onClick={closeMobileFilters}
          >
            <div
              ref={mobileFilterSheetRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="mobile-vibe-filters-title"
              className="absolute inset-x-0 bottom-0 rounded-t-[1.5rem] bg-papyrus px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-5 shadow-[0_-24px_64px_-24px_rgba(0,0,0,0.38)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-label text-[10px] font-medium uppercase tracking-[0.24em] text-label">
                    {vibe.name}
                  </p>
                  <h2 id="mobile-vibe-filters-title" className="font-headline mt-2 text-2xl font-semibold tracking-tight text-obsidian">
                    Filter &amp; sort
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
                  <label htmlFor="mobile-vibe-sort" className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-label">
                    Sort
                  </label>
                  <div className="relative">
                    <select
                      id="mobile-vibe-sort"
                      value={sortKey}
                      onChange={(e) => setSortKey(e.target.value as ProductSortKey)}
                      className="min-h-12 w-full appearance-none rounded-sm border border-stone bg-white py-0 pl-4 pr-10 text-sm text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                    >
                      {SORT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <ChevronIcon />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="mobile-vibe-price" className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-label">
                    Price
                  </label>
                  <div className="relative">
                    <select
                      id="mobile-vibe-price"
                      value={priceFilter}
                      onChange={(e) => setPriceFilter(e.target.value as PriceFilter)}
                      className="min-h-12 w-full appearance-none rounded-sm border border-stone bg-white py-0 pl-4 pr-10 text-sm text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                    >
                      {PRICE_FILTERS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <ChevronIcon />
                  </div>
                </div>

                {artistOptions.length > 1 ? (
                  <div className="flex flex-col gap-2">
                    <label htmlFor="mobile-vibe-artist" className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-label">
                      Artist
                    </label>
                    <div className="relative">
                      <select
                        id="mobile-vibe-artist"
                        value={artistSlug}
                        onChange={(e) => setArtistSlug(e.target.value)}
                        className="min-h-12 w-full appearance-none rounded-sm border border-stone bg-white py-0 pl-4 pr-10 text-sm text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                      >
                        <option value="all">All artists</option>
                        {artistOptions.map((aSlug) => {
                          const a = getArtist(aSlug);
                          return (
                            <option key={aSlug} value={aSlug}>
                              {a?.name ?? aSlug}
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
                  Show {list.length} {list.length === 1 ? 'design' : 'designs'}
                </button>
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSortKey('featured');
                      setPriceFilter('all');
                      setArtistSlug('all');
                    }}
                    className="font-label inline-flex min-h-11 items-center justify-center rounded-sm border border-stone bg-white px-6 py-3 text-[11px] font-medium uppercase tracking-[0.2em] text-obsidian shadow-sm transition-colors hover:border-desert-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                  >
                    Reset filters
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
