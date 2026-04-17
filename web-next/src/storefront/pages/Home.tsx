import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { trackHomeScrollMilestone, trackHomeView, trackHoroFunnelStep } from '../analytics/funnel';
import { MerchProductCard } from '../components/MerchProductCard';
import { ProductQuickView } from '../components/ProductQuickView';

import { HomeHeroWearMean } from '../components/HomeHeroWearMean';
import { HomeGiftBlock } from '../components/HomeGiftBlock';
import { HomeMarqueeBand } from '../components/HomeMarqueeBand';
import { HomeProofSplit } from '../components/HomeProofSplit';
import { HomeStudioProof } from '../components/HomeStudioProof';
import { HomeTrustRibbon } from '../components/HomeTrustRibbon';
import { useScrollReveal } from '../hooks/useScrollReveal';
import type { RuntimeCatalog } from '../data/catalog-types';
import { getFeelingCollectionVisual, getProductCardImageSrc, imgUrl } from '../data/images';
import {
  getArtist,
  getFeeling,
  getFeelings,
  getProducts,
  getSubfeeling,
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
  const { copy, locale } = useUiLocale();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [compactHome, setCompactHome] = useState(false);

  useEffect(() => {
    const q = searchParams.get('compact');
    if (q === '1') sessionStorage.setItem(COMPACT_HOME_STORAGE, '1');
    setCompactHome(q === '1' || sessionStorage.getItem(COMPACT_HOME_STORAGE) === '1');
  }, [searchParams]);
  const latestDrops = (initialProducts ?? getProducts()).filter(productHasRealImage).slice(0, 8);
  const featuredFeelings = getFeelings().slice(0, 4);
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
      <HomeTrustRibbon />
      <section className="border-t border-stone/20 bg-papyrus px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2.5">
          <Link
            to="/products?sort=newest"
            className="font-label inline-flex min-h-11 items-center rounded-full border border-obsidian bg-obsidian px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-obsidian/90"
          >
            {locale === 'ar' ? 'إصدار جديد' : 'New drop'}
          </Link>
          <Link
            to="/products?sort=featured"
            className="font-label inline-flex min-h-11 items-center rounded-full border border-stone bg-white px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-obsidian transition-colors hover:border-obsidian"
          >
            {locale === 'ar' ? 'الأكثر مبيعاً' : 'Best sellers'}
          </Link>
          <Link
            to="/products?fOccasion=gift-something-real"
            className="font-label inline-flex min-h-11 items-center rounded-full border border-stone bg-white px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-obsidian transition-colors hover:border-obsidian"
          >
            {locale === 'ar' ? 'جاهز للهدايا' : 'Gift-ready'}
          </Link>
        </div>
      </section>

      <section
        aria-labelledby="home-latest-drop-title"
        className="border-t border-stone/20 bg-papyrus px-4 py-12 sm:px-6 md:py-14 lg:px-8"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-label text-[10px] font-medium uppercase tracking-[0.26em] text-label">
                {locale === 'ar' ? 'ابدأ من هنا' : 'Start here'}
              </p>
              <h2
                id="home-latest-drop-title"
                data-reveal
                className="font-headline mt-2 text-xl font-medium tracking-tight text-obsidian md:text-2xl"
              >
                {copy.home.featuredTitle}
              </h2>
            </div>
            <Link
              data-reveal="stagger-1"
              to="/products"
              className="cta-clay font-body inline-flex min-h-12 w-fit items-center justify-center border border-obsidian/80 px-5 py-2.5 text-sm font-medium text-obsidian transition-colors hover:border-obsidian hover:bg-obsidian hover:text-clean-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-river"
            >
              {copy.home.featuredCta}
            </Link>
          </div>
          <div className="grid grid-cols-2 items-stretch gap-x-3 gap-y-6 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-3">
            {latestDrops.map((p, i) => {
              const feelingSlug = p.primaryFeelingSlug ?? p.feelingSlug;
              const feeling = getFeeling(feelingSlug);
              const lineSlug = p.primarySubfeelingSlug ?? p.lineSlug;
              const line = lineSlug ? getSubfeeling(lineSlug) : undefined;
              const categoryEyebrow =
                feeling && line?.feelingSlug === feelingSlug
                  ? `${feeling.name} / ${line.name}`
                  : feeling?.name;
              const artist = getArtist(p.artistSlug);
              const main = getProductCardImageSrc(p);
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
                  proofChip={p.fitLabel ?? p.trustBadges?.find(Boolean)}
                  eyebrow={categoryEyebrow}
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
          <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between" data-reveal>
            <div>
              <p className="font-label text-[10px] font-medium uppercase tracking-[0.26em] text-label">{copy.home.feelingsEyebrow}</p>
              <h2 id="home-feelings-title" className="font-headline mt-2 text-xl font-medium tracking-tight text-obsidian md:text-2xl">
                {copy.home.feelingsTitle}
              </h2>
            </div>
            <Link
              to="/feelings"
              className="font-body inline-flex min-h-11 w-fit items-center justify-center px-1 text-sm font-medium text-deep-teal transition-colors hover:text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-river"
            >
              {locale === 'ar' ? 'عرض كل المشاعر ←' : 'See all feelings →'}
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {featuredFeelings.map((feeling, i) => {
              const visual = getFeelingCollectionVisual(feeling.slug).cover;
              const hasImage = Boolean(visual?.src);
              return (
                <Link
                  key={feeling.slug}
                  to={`/feelings/${feeling.slug}`}
                  data-reveal={(['stagger-1', 'stagger-2', 'stagger-3', 'stagger-4'] as const)[i % 4]}
                  style={{ backgroundColor: feeling.accent }}
                  className="feeling-tile group relative flex aspect-square flex-col justify-between overflow-hidden rounded-[18px] p-6 text-white shadow-sm transition-transform duration-300 hover:-translate-y-[2px] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal md:p-8"
                >
                  {hasImage ? (
                    <img
                      src={imgUrl(visual.src, 800)}
                      alt={visual.alt ?? ''}
                      loading="lazy"
                      decoding="async"
                      aria-hidden={visual.alt ? undefined : true}
                      className="pointer-events-none absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  ) : null}
                  <span
                    aria-hidden
                    style={{ backgroundColor: feeling.accent }}
                    className="pointer-events-none absolute inset-0 mix-blend-multiply opacity-55"
                  />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-linear-to-b from-obsidian/10 via-obsidian/35 to-obsidian/85"
                  />
                  <span className="relative font-label text-[10px] font-semibold uppercase tracking-[0.24em] text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.55)]">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="relative">
                    <h3 className="font-headline text-[clamp(1.5rem,4.5vw,2.25rem)] font-semibold leading-tight tracking-tight text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]">
                      {feeling.name}
                    </h3>
                    <span className="font-label mt-3 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-white transition-transform duration-300 group-hover:translate-x-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.55)]">
                      {locale === 'ar' ? 'اكتشف ←' : 'Explore →'}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <HomeMarqueeBand />

      <HomeProofSplit />
      <HomeGiftBlock />
      <HomeStudioProof />

      <ProductQuickView open={quickViewSlug !== null} productSlug={quickViewSlug} onClose={() => setQuickViewSlug(null)} />
    </div>
  );
}
