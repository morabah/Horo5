import { Link, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { getEditorialBlockByVibeSlug } from '../data/homeEditorial';
import { getArtist, getVibe, productsByVibe, vibes } from '../data/site';
import { getProductMedia, heroStreet, imgUrl, vibeCovers } from '../data/images';
import { TeeImageFrame } from '../components/TeeImage';
import { formatEgp } from '../utils/formatPrice';
import { sortProductList, type ProductSortKey } from '../utils/productSort';
import { ProductQuickView } from '../components/ProductQuickView';
import { useScrollReveal } from '../hooks/useScrollReveal';

/** Show numeric design count in hero only when catalog feels substantial */
const DESIGN_COUNT_MIN = 4;

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

export function VibeCollection() {
  useScrollReveal();
  const { slug = '' } = useParams();
  const vibe = getVibe(slug);
  const baseList = productsByVibe(slug);
  const [sortKey, setSortKey] = useState<ProductSortKey>('featured');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all');
  const [artistSlug, setArtistSlug] = useState<string>('all');
  const [quickViewSlug, setQuickViewSlug] = useState<string | null>(null);

  const editorialBlock = useMemo(() => getEditorialBlockByVibeSlug(slug), [slug]);

  useEffect(() => {
    setSortKey('featured');
    setPriceFilter('all');
    setArtistSlug('all');
  }, [slug]);

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

  return (
    <div className="bg-papyrus pb-16">
      <a
        href="#vibe-collection-products"
        className="sr-only left-4 top-[max(0.75rem,env(safe-area-inset-top))] z-250 rounded-sm border border-outline-variant/50 bg-papyrus px-4 py-3 font-label text-[11px] font-semibold uppercase tracking-widest text-obsidian shadow-md outline-none ring-deep-teal focus:not-sr-only focus:fixed focus:ring-2"
      >
        Skip to collection
      </a>
      {/* Compact collection header — short banner so filters / grid enter first viewport */}
      <section className="relative w-full overflow-hidden bg-obsidian text-white" aria-labelledby="vibe-collection-title">
        <div className="relative mx-auto max-w-7xl">
          <div className="relative h-[min(28vh,10.5rem)] sm:h-[min(30vh,11.5rem)] md:h-[min(32vh,13rem)]">
            <img
              alt={`${vibe.name} vibe — HORO lookbook`}
              className="absolute inset-0 h-full w-full object-cover object-[center_22%] opacity-85"
              src={imgUrl(heroCover, 1200)}
              width={1200}
              height={600}
              decoding="async"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/50 via-black/25 to-obsidian/95"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 opacity-35"
              style={{ background: `linear-gradient(to top right, ${vibe.accent}88, transparent 50%)` }}
              aria-hidden
            />
          </div>
          <div className="border-t border-white/10 px-6 py-4 md:px-10 md:py-5">
            <div className="text-center md:text-left">
              <h1
                id="vibe-collection-title"
                className="font-headline text-[clamp(1.65rem,4.2vw,2.75rem)] font-semibold leading-tight tracking-tight text-white"
              >
                {vibe.name}
              </h1>
              <p className="font-body mx-auto mt-2 max-w-xl text-sm leading-relaxed text-stone md:mx-0 md:text-base">
                {vibe.tagline}
              </p>
              <p className="font-label mt-2 text-[10px] font-medium uppercase tracking-[0.28em] text-stone/90 md:text-[11px]">
                {list.length >= DESIGN_COUNT_MIN
                  ? `${list.length} designs`
                  : 'Curated selection'}
              </p>
            </div>
            <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between md:mt-5">
              <nav className="font-body text-[13px] text-stone md:text-sm" aria-label="Breadcrumb">
                <Link to="/" className="text-desert-sand transition-colors hover:text-white">
                  Home
                </Link>
                <span className="text-stone/50" aria-hidden>
                  {' '}
                  /{' '}
                </span>
                <Link to="/vibes" className="text-desert-sand transition-colors hover:text-white">
                  Vibes
                </Link>
                <span className="text-stone/50" aria-hidden>
                  {' '}
                  /{' '}
                </span>
                <span className="text-white">{vibe.name}</span>
              </nav>
              <Link
                to={`/?vibe=${encodeURIComponent(slug)}`}
                className="link-underline-reveal font-label shrink-0 text-[11px] font-medium uppercase tracking-wide text-desert-sand transition-colors hover:text-white"
              >
                Back to story
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-16 px-6 pt-4 pb-12 md:space-y-24 md:pt-6 md:pb-20 lg:space-y-28">
        <section id="vibe-collection-products" className="scroll-mt-[calc(5.5rem+env(safe-area-inset-top,0px))]">
          <p className="mb-4 text-center font-label text-[11px] font-medium uppercase tracking-[0.22em] text-clay md:mb-6">
            <a
              href="#vibe-story"
              className="text-deep-teal underline decoration-deep-teal/30 underline-offset-4 transition-colors hover:text-obsidian hover:decoration-obsidian/40"
            >
              Read the story
            </a>
          </p>
          {manifestoLine ? (
            <blockquote className="font-pdp-serif mx-auto mb-10 max-w-2xl px-2 text-center text-[clamp(1.125rem,2.5vw,1.5rem)] font-normal italic leading-relaxed tracking-wide text-obsidian md:mb-12">
              <span className="text-clay/80" aria-hidden>
                &ldquo;
              </span>
              {manifestoLine}
              <span className="text-clay/80" aria-hidden>
                &rdquo;
              </span>
            </blockquote>
          ) : null}

          <div
            className="sticky z-20 -mx-6 mb-8 flex flex-col gap-3 border-b border-stone/30 bg-papyrus/95 px-6 py-3 backdrop-blur-sm sm:flex-row sm:flex-wrap sm:items-center md:mx-0 md:px-0"
            style={{
              top: 'calc(5.5rem + env(safe-area-inset-top, 0px))',
            }}
          >
          <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:flex-1 sm:min-w-0">
          {/* Sort */}
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:flex-initial">
            <label htmlFor="vibe-sort" className="text-xs font-medium text-label">
              Sort
            </label>
            <div className="relative inline-block min-w-0">
              <select
                id="vibe-sort"
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as ProductSortKey)}
                className="min-h-12 w-full appearance-none rounded-lg border border-stone bg-white py-0 pl-3 pr-8 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronIcon />
            </div>
          </div>

          {/* R2-2 — Price filter */}
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:flex-initial">
            <label htmlFor="vibe-price" className="text-xs font-medium text-label">
              Price
            </label>
            <div className="relative inline-block min-w-0">
              <select
                id="vibe-price"
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value as PriceFilter)}
                className="min-h-12 w-full appearance-none rounded-lg border border-stone bg-white py-0 pl-3 pr-8 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
              >
                {PRICE_FILTERS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronIcon />
            </div>
          </div>

          {/* Artist filter */}
          {artistOptions.length > 1 ? (
            <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto">
              <label htmlFor="vibe-artist" className="text-xs font-medium text-label">
                Artist
              </label>
              <div className="relative inline-block min-w-0">
                <select
                  id="vibe-artist"
                  value={artistSlug}
                  onChange={(e) => setArtistSlug(e.target.value)}
                  className="min-h-12 w-full appearance-none rounded-lg border border-stone bg-white py-0 pl-3 pr-8 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
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
            className="link-underline-reveal font-label w-full justify-center text-center text-[11px] font-medium uppercase tracking-wide text-deep-teal sm:ml-auto sm:w-auto sm:justify-end sm:text-left min-h-12 inline-flex items-center"
          >
            Search in this vibe
          </Link>
        </div>

        <div className="vibe-product-grid">
          {list.map((p, i) => {
            const { main } = getProductMedia(p.slug);
            const artist = getArtist(p.artistSlug);
            const artistPart = artist?.name ?? 'HORO';
            const stagger = (['stagger-1', 'stagger-2', 'stagger-3', 'stagger-4', 'stagger-5'] as const)[i % 5];
            return (
              <article
                key={p.slug}
                className="group flex flex-col items-center"
                data-reveal={stagger}
              >
                <Link
                  to={`/products/${p.slug}`}
                  className="block w-full text-inherit no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                >
                  <div className="relative mb-4 w-full overflow-hidden rounded-md bg-surface-container-high shadow-sm ring-1 ring-black/5">
                    <div className="transition-transform duration-700 ease-out group-hover:scale-[1.05]">
                      <TeeImageFrame
                        src={main}
                        alt={`HORO “${p.name}” graphic tee`}
                        w={700}
                        aspectRatio="4/5"
                        borderRadius="0.375rem"
                        frameStyle={{ marginBottom: 0 }}
                      />
                    </div>
                    <button
                      type="button"
                      className="quick-view-pill font-label pointer-events-auto absolute bottom-3 left-3 right-3 z-10 min-h-12 rounded-full px-4 py-3 text-center text-xs font-medium uppercase tracking-[0.2em] text-obsidian transition-shadow hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setQuickViewSlug(p.slug);
                      }}
                      aria-label={`Quick view: ${p.name}`}
                    >
                      Quick view
                    </button>
                  </div>
                  <div className="font-headline w-full max-w-[min(100%,20rem)] px-1 text-center sm:max-w-none">
                    <p className="text-[11px] font-medium uppercase leading-snug tracking-[0.2em] text-clay md:text-sm md:tracking-[0.22em]">
                      {artistPart}
                    </p>
                    <p className="mt-1.5 text-[13px] font-medium uppercase leading-snug tracking-[0.12em] text-obsidian md:text-sm md:tracking-[0.14em]">
                      {p.name}
                    </p>
                    <p className="font-pdp-serif mt-2 text-[15px] font-normal tracking-normal text-obsidian md:text-base">
                      {formatEgp(p.priceEgp)}
                    </p>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>

        {list.length === 0 && (priceFilter !== 'all' || artistSlug !== 'all') && (
          <p className="mt-6 font-body text-clay">
            No designs match these filters.{' '}
            <button
              type="button"
              onClick={() => {
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

        <div className="mt-12 flex flex-col items-center gap-4 md:mt-14">
          <Link
            to="/vibes"
            className="font-label inline-flex min-h-12 items-center justify-center rounded-sm px-8 py-3 text-sm font-medium uppercase tracking-[0.2em] text-obsidian backdrop-blur-md bg-white/30 border border-white/60 shadow-sm hover:bg-white/50 transition-colors"
          >
            Explore all vibes
          </Link>
        </div>
        </section>

        {/* Brand story — below shop; anchor target for “Read the story” */}
        <section
          id="vibe-story"
          className="scroll-mt-[calc(5.5rem+env(safe-area-inset-top,0px))] flex flex-col items-center gap-10 border-t border-stone/25 pt-12 md:flex-row md:gap-14 md:pt-16 lg:gap-20"
          aria-labelledby="vibe-story-heading"
        >
          <div className="w-full md:w-1/2">
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
          <div className="w-full space-y-4 md:w-1/2">
            {editorialBlock ? (
              <h2 id="vibe-story-heading" className="font-label text-[11px] font-medium uppercase tracking-[0.22em] text-label">
                {editorialBlock.kicker}
              </h2>
            ) : (
              <h2 id="vibe-story-heading" className="font-headline text-xl font-semibold uppercase tracking-tight text-obsidian md:text-2xl">
                {vibe.name}
              </h2>
            )}
            <p className="font-body max-w-md text-lg leading-relaxed text-warm-charcoal md:text-[17px]">{storyLead}</p>
            <a
              href="#vibe-collection-products"
              className="font-label inline-flex min-h-12 items-center justify-center rounded-sm px-8 py-3 text-sm font-medium uppercase tracking-[0.2em] text-obsidian backdrop-blur-md bg-white/30 border border-white/60 shadow-sm hover:bg-white/50 transition-colors"
            >
              Shop the designs
            </a>
          </div>
        </section>

        <section className="mt-14 border-t border-stone/25 pt-12 md:mt-20 md:pt-16">
          <h2 className="font-pdp-serif mb-8 text-center text-[clamp(1.25rem,3vw,1.75rem)] font-normal uppercase tracking-[0.28em] text-obsidian md:mb-10 md:tracking-[0.32em]">
            Explore other vibes
          </h2>
          <div className="flex flex-wrap justify-center gap-3 md:gap-4">
            {others.map((v) => (
              <Link
                key={v.slug}
                to={`/vibes/${v.slug}`}
                className="btn btn-ghost inline-flex items-center gap-2.5 text-sm"
              >
                <span
                  className="h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-solid bg-papyrus"
                  style={{ borderColor: v.accent }}
                  aria-hidden
                >
                  <img
                    alt=""
                    className="h-full w-full object-cover"
                    src={imgUrl(vibeCovers[v.slug] ?? heroStreet, 96)}
                    width={48}
                    height={48}
                  />
                </span>
                {v.name}
              </Link>
            ))}
          </div>
        </section>
      </div>

      <ProductQuickView open={quickViewSlug !== null} productSlug={quickViewSlug} onClose={() => setQuickViewSlug(null)} />
    </div>
  );
}
