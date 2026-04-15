import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { trackHomeScrollMilestone, trackHomeView, trackHoroFunnelStep } from '../analytics/funnel';
import { MerchProductCard } from '../components/MerchProductCard';
import { ProductQuickView } from '../components/ProductQuickView';

import { HomeHeroWearMean } from '../components/HomeHeroWearMean';
import { HomeProofSplit } from '../components/HomeProofSplit';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { getFeelingCollectionVisual } from '../data/images';
import type { RuntimeCatalog } from '../data/catalog-types';
import {
  getArtist,
  getFeeling,
  getFeelings,
  getProducts,
  productHasRealImage,
  setRuntimeCatalog,
  type Product,
} from '../data/site';
import { useUiLocale } from '../i18n/ui-locale';

const COMPACT_HOME_STORAGE = 'horo_home_compact';
const HOME_VIEW_SESSION_KEY = 'horo_home_view_session_v1';

export function Home({
  initialCatalog,
  initialProducts,
}: { initialCatalog?: RuntimeCatalog | null; initialProducts?: Product[] } = {}) {
  if (initialCatalog) {
    setRuntimeCatalog(initialCatalog);
  } else if (initialProducts?.length) {
    setRuntimeCatalog({ products: initialProducts });
  }

  useScrollReveal();
  const { copy } = useUiLocale();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [compactHome, setCompactHome] = useState(false);

  useEffect(() => {
    const q = searchParams.get('compact');
    if (q === '1') sessionStorage.setItem(COMPACT_HOME_STORAGE, '1');
    setCompactHome(q === '1' || sessionStorage.getItem(COMPACT_HOME_STORAGE) === '1');
  }, [searchParams]);
  const latestDrops = (initialProducts ?? getProducts()).filter(productHasRealImage).slice(0, 6);
  const featuredFeelings = getFeelings()
    .slice(0, 12)
    .filter((feeling) => Boolean(getFeelingCollectionVisual(feeling.slug).cover.src?.trim()))
    .slice(0, 6);
  const homeTrustItems = useMemo(() => {
    return [...new Set(latestDrops.flatMap((product) => product.trustBadges ?? []).filter(Boolean))].slice(0, 3);
  }, [latestDrops]);
  const [quickViewSlug, setQuickViewSlug] = useState<string | null>(null);

  useEffect(() => {
    const feelingParam = searchParams.get('feeling') ?? searchParams.get('vibe');
    if (!feelingParam || !getFeeling(feelingParam)) return;

    const id = `feeling-${feelingParam}`;
    const t = window.setTimeout(() => {
      const el = document.getElementById(id);
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete('feeling');
          next.delete('vibe');
          return next;
        },
        { replace: true },
      );
    }, 120);

    return () => window.clearTimeout(t);
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (location.pathname !== '/') return;
    if (sessionStorage.getItem(HOME_VIEW_SESSION_KEY)) return;
    sessionStorage.setItem(HOME_VIEW_SESSION_KEY, '1');
    trackHomeView({ compact_home: compactHome });
  }, [location.pathname, compactHome]);

  useEffect(() => {
    if (location.pathname !== '/') return;
    function onScroll() {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      if (max <= 0) return;
      const p = Math.round((el.scrollTop / max) * 100);
      for (const b of [25, 50, 75, 90] as const) {
        if (p >= b) trackHomeScrollMilestone(b, compactHome);
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [location.pathname, compactHome]);

  useEffect(() => {
    if (location.pathname !== '/' || !quickViewSlug) return;
    trackHoroFunnelStep({
      step: 'home_quick_view_open',
      target: quickViewSlug,
      compact_home: compactHome,
    });
  }, [quickViewSlug, location.pathname, compactHome]);

  return (
    <div className="home-grain">
      <HomeHeroWearMean />

      <section
        aria-labelledby="home-latest-drop-title"
        className="border-t border-stone/20 bg-papyrus px-4 py-12 sm:px-6 md:py-14 lg:px-8"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-label text-[10px] font-medium uppercase tracking-[0.26em] text-label">
                Buy fast
              </p>
              <h2
                id="home-latest-drop-title"
                data-reveal
                className="font-headline mt-2 text-xl font-medium tracking-tight text-obsidian md:text-2xl"
              >
                {copy.home.featuredTitle}
              </h2>
              <p className="mt-2 max-w-2xl font-body text-sm text-warm-charcoal md:text-[15px]">
                Start with real products, real prices, and the shortest route to checkout. No taxonomy required.
              </p>
              {homeTrustItems.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {homeTrustItems.map((item) => (
                    <span
                      key={item}
                      className="font-label rounded-full border border-stone/40 bg-white px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-warm-charcoal"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
            <Link
              data-reveal="stagger-1"
              to="/products"
              className="cta-clay font-body inline-flex min-h-10 w-fit items-center justify-center border border-obsidian/80 px-5 py-2.5 text-sm font-medium text-obsidian transition-colors hover:border-obsidian hover:bg-obsidian hover:text-clean-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-river"
            >
              {copy.home.featuredCta}
            </Link>
          </div>
          <div className="grid grid-cols-1 items-stretch gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {latestDrops.map((p, i) => {
              const feeling = getFeeling(p.primaryFeelingSlug ?? p.feelingSlug);
              const artist = getArtist(p.artistSlug);
              const main = p.media?.main ?? p.thumbnail ?? '';
              return (
                <MerchProductCard
                  key={p.slug}
                  slug={p.slug}
                  name={p.name}
                  compareAtPriceEgp={p.originalPriceEgp ?? undefined}
                  priceEgp={p.priceEgp}
                  imageSrc={main}
                  imageAlt={`HORO “${p.name}” graphic tee`}
                  merchandisingBadge={p.merchandisingBadge}
                  eyebrow={feeling?.name}
                  eyebrowAccent={feeling?.accent}
                  useCase={p.useCase}
                  artistCredit={artist ? `Illustrated by ${artist.name}` : undefined}
                  variant="minimal"
                  onQuickView={setQuickViewSlug}
                  className="relative h-full"
                  data-reveal={(['stagger-1', 'stagger-2', 'stagger-3', 'stagger-4'] as const)[i % 4]}
                />
              );
            })}
          </div>
        </div>
      </section>

      <section
        aria-labelledby="home-feelings-title"
        className="border-t border-stone/20 bg-papyrus px-4 py-12 sm:px-6 md:py-14 lg:px-8"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 md:mb-10" data-reveal>
            <p className="font-label text-[10px] font-medium uppercase tracking-[0.26em] text-label">{copy.home.feelingsEyebrow}</p>
            <h2 id="home-feelings-title" className="font-headline mt-2 text-xl font-medium tracking-tight text-obsidian md:text-2xl">
              {copy.home.feelingsTitle}
            </h2>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/products"
                className="cta-clay font-body inline-flex min-h-11 items-center justify-center border border-obsidian/15 bg-linen px-6 py-3 text-sm font-medium text-obsidian transition-colors hover:border-obsidian/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-river"
              >
                {copy.shell.shopAll}
              </Link>
              <Link
                to="/feelings"
                className="font-body inline-flex min-h-11 items-center justify-center px-1 text-sm font-medium text-deep-teal transition-colors hover:text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-river"
              >
                {copy.shell.shopByFeeling}
              </Link>
              <Link
                to="/occasions"
                className="font-body inline-flex min-h-11 items-center justify-center px-1 text-sm font-medium text-deep-teal transition-colors hover:text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-river"
              >
                {copy.home.momentsCta}
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredFeelings.map((feeling, i) => {
              const cover = getFeelingCollectionVisual(feeling.slug).cover;
              const coverSrc = cover.src;
              const featuredCard = i === 0;
              return (
                <Link
                  key={feeling.slug}
                  to={`/feelings/${feeling.slug}`}
                  data-reveal={(['stagger-1', 'stagger-2', 'stagger-3'] as const)[i % 3]}
                  className={`group relative flex min-h-[16rem] flex-col overflow-hidden rounded-[18px] bg-white ring-1 ring-stone/30 transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal ${
                    featuredCard ? 'lg:col-span-2 lg:min-h-[18.5rem]' : ''
                  }`}
                >
                  <div className={`relative w-full overflow-hidden bg-stone/5 ${
                    featuredCard ? 'aspect-[16/10]' : 'aspect-[4/5]'
                  }`}>
                     {coverSrc && (
                       <img
                         src={coverSrc}
                         className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                         alt={feeling.cardImageAlt || cover.alt || feeling.name}
                         loading="lazy"
                       />
                     )}
                  </div>
                  <div className="flex flex-1 flex-col p-6 bg-papyrus/20">
                    <div
                      className="mb-3 h-3 w-3 rounded-full shadow-inner"
                      style={{ backgroundColor: feeling.accent, border: '1px solid rgba(0,0,0,0.1)' }}
                      aria-hidden
                    />
                    <h3 className="font-headline text-lg font-semibold tracking-tight text-obsidian transition-colors group-hover:text-deep-teal">{feeling.name}</h3>
                    <span className="font-label mt-4 text-[10px] uppercase tracking-widest text-deep-teal">Explore &rarr;</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <HomeProofSplit />

      <ProductQuickView open={quickViewSlug !== null} productSlug={quickViewSlug} onClose={() => setQuickViewSlug(null)} />
    </div>
  );
}
