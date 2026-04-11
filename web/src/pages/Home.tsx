import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { trackHomeScrollMilestone, trackHomeView, trackHoroFunnelStep } from '../analytics/funnel';
import { MerchProductCard } from '../components/MerchProductCard';
import { ProductQuickView } from '../components/ProductQuickView';

import { HomeHeroWearMean } from '../components/HomeHeroWearMean';
import { HomeGiftBlock } from '../components/HomeGiftBlock';
import { HomeProofSplit } from '../components/HomeProofSplit';
import { HomeStudioProof } from '../components/HomeStudioProof';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { getFeelingCollectionVisual, getProductMedia } from '../data/images';
import { getArtist, getFeeling, getFeelings, getProducts, type Product } from '../data/site';
import { BRAND_COPY } from '../data/brand';
import { HOME_COPY, HOME_ORIENTATION_STEPS } from '../data/homeContent';
import { useUiLocale } from '../i18n/ui-locale';
import { notifyHomeWaitlistSignup } from '../utils/homeWaitlist';

const COMPACT_HOME_STORAGE = 'horo_home_compact';
const HOME_VIEW_SESSION_KEY = 'horo_home_view_session_v1';

export function Home({ initialProducts }: { initialProducts?: Product[] } = {}) {
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
  const latestDrops = (initialProducts ?? getProducts()).slice(0, 4);
  const [quickViewSlug, setQuickViewSlug] = useState<string | null>(null);
  const [waitlistContact, setWaitlistContact] = useState('');
  const [waitlistStatus, setWaitlistStatus] = useState<'idle' | 'success' | 'error'>('idle');

  function handleWaitlistSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalized = waitlistContact.trim();
    if (!normalized || normalized.length < 5) {
      setWaitlistStatus('error');
      return;
    }

    notifyHomeWaitlistSignup(normalized);
    setWaitlistContact('');
    setWaitlistStatus('success');
  }

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
        aria-labelledby="home-feelings-title"
        className="border-t border-stone/20 bg-papyrus px-4 py-12 sm:px-6 md:py-14 lg:px-8"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 md:mb-10" data-reveal>
            <p className="font-label text-[10px] font-medium uppercase tracking-[0.26em] text-label">{copy.home.feelingsEyebrow}</p>
            <h2 id="home-feelings-title" className="font-headline mt-2 text-xl font-medium tracking-tight text-obsidian md:text-2xl">
              {copy.home.feelingsTitle}
            </h2>
            <p className="mt-2 max-w-xl font-body text-sm text-warm-charcoal md:text-[15px]">
              {HOME_COPY.vibesBody}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {getFeelings().map((feeling, i) => {
              const coverSrc = getFeelingCollectionVisual(feeling.slug).cover.src;
              return (
                <Link
                  key={feeling.slug}
                  to={`/feelings/${feeling.slug}`}
                  data-reveal={(['stagger-1', 'stagger-2', 'stagger-3'] as const)[i % 3]}
                  className="group relative flex min-h-[16rem] flex-col overflow-hidden rounded-[18px] bg-white ring-1 ring-stone/30 transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                >
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-stone/5">
                     {coverSrc && <img src={coverSrc} className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]" alt="" loading="lazy" />}
                  </div>
                  <div className="flex flex-1 flex-col p-6 bg-papyrus/20">
                    <div 
                      className="mb-3 h-3 w-3 rounded-full shadow-inner"
                      style={{ backgroundColor: feeling.accent, border: '1px solid rgba(0,0,0,0.1)' }}
                      aria-hidden
                    />
                    <h3 className="font-headline text-lg font-semibold tracking-tight text-obsidian transition-colors group-hover:text-deep-teal">{feeling.name}</h3>
                    <p className="mt-2 flex-1 font-body text-[13px] leading-relaxed text-clay transition-colors group-hover:text-warm-charcoal">{feeling.tagline}</p>
                    <span className="font-label mt-4 text-[10px] uppercase tracking-widest text-deep-teal opacity-0 transition-opacity group-hover:opacity-100">Explore &rarr;</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section
        aria-labelledby="home-moments-title"
        className="border-t border-stone/20 bg-papyrus px-4 py-12 sm:px-6 md:py-14 lg:px-8"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 md:mb-8" data-reveal>
            <p className="font-label text-[10px] font-medium uppercase tracking-[0.26em] text-label">{copy.home.momentsEyebrow}</p>
            <h2 id="home-moments-title" className="font-headline mt-2 text-lg font-medium tracking-tight text-obsidian md:text-xl">
              {copy.home.momentsTitle}
            </h2>
            <p className="mt-2 max-w-xl font-body text-sm text-warm-charcoal md:text-[15px]">
              Browse by real occasions — the same trust, COD, and exchange path you expect in Egypt.
            </p>
          </div>
          <Link
            data-reveal="stagger-1"
            to="/occasions"
            className="cta-clay font-body inline-flex min-h-11 items-center justify-center border border-obsidian/15 bg-linen px-8 py-3 text-sm font-medium text-obsidian transition-colors hover:border-obsidian/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-river"
          >
            {copy.home.momentsCta}
          </Link>
        </div>
      </section>

      {/* Latest drop */}
      <section
        aria-labelledby="home-latest-drop-title"
        className="border-t border-stone/20 bg-papyrus px-4 py-16 sm:px-6 md:py-20 lg:px-8"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2
                id="home-latest-drop-title"
                data-reveal
              className="font-headline text-xl font-medium tracking-tight text-obsidian md:text-2xl"
            >
                {copy.home.featuredTitle}
              </h2>
            </div>
            <Link
              data-reveal="stagger-1"
              to="/feelings"
              className="cta-clay font-body inline-flex min-h-10 w-fit items-center justify-center border border-obsidian/80 px-5 py-2.5 text-sm font-medium text-obsidian transition-colors hover:border-obsidian hover:bg-obsidian hover:text-clean-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-river"
            >
              {copy.home.featuredCta}
            </Link>
          </div>
          <div className="grid grid-cols-1 items-stretch gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {latestDrops.map((p, i) => {
              const feeling = getFeeling(p.primaryFeelingSlug ?? p.feelingSlug);
              const artist = getArtist(p.artistSlug);
              const main = p.media?.main ?? getProductMedia(p.slug).main;
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
                  proofChip="220 GSM cotton"
                  useCase={p.useCase}
                  artistCredit={artist ? `Illustrated by ${artist.name}` : undefined}
                  variant="minimal"
                  onQuickView={setQuickViewSlug}
                  className="relative h-full"
                  data-reveal={(['stagger-1', 'stagger-2', 'stagger-3', 'stagger-4'] as const)[i]}
                />
              );
            })}
          </div>
        </div>
      </section>

      {!compactHome ? (
        <section aria-labelledby="home-plan-title" className="border-t border-stone/20 bg-papyrus px-4 py-12 sm:px-6 md:py-14 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="mb-8 text-center md:mb-10" data-reveal>
              <p className="font-label text-[10px] font-medium uppercase tracking-[0.24em] text-label">{copy.home.planEyebrow}</p>
              <h2 id="home-plan-title" className="font-headline mt-2 text-xl font-medium tracking-tight text-obsidian md:text-2xl">
                {copy.home.planTitle}
              </h2>
            </div>
            <ol
              className="grid list-none grid-cols-1 gap-6 border-y border-stone/20 py-8 md:grid-cols-[minmax(0,1fr)_2.75rem_minmax(0,1fr)_2.75rem_minmax(0,1fr)] md:items-start md:gap-y-0 md:py-10"
              data-reveal
            >
              {HOME_ORIENTATION_STEPS.flatMap((step, i) => {
                const stepReveal = (['stagger-1', 'stagger-2', 'stagger-3'] as const)[i];
                const stepColumn = (['md:col-start-1', 'md:col-start-3', 'md:col-start-5'] as const)[i];
                const connectorColumn = (['md:col-start-2', 'md:col-start-4'] as const)[i];

                return [
                  <li
                    key={step.title}
                    className={`flex flex-col items-center gap-4 px-2 text-center md:px-3 ${stepColumn}`}
                    data-reveal={stepReveal}
                  >
                    <span className="font-label inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-desert-sand/30 text-sm font-semibold tracking-[0.18em] text-clay">
                      {`0${i + 1}`}
                    </span>
                    <h3 className="font-headline max-w-56 text-[0.95rem] font-medium leading-snug tracking-tight text-obsidian md:text-[1.02rem]">
                      {step.title}
                    </h3>
                    <p className="max-w-64 font-body text-sm leading-relaxed text-warm-charcoal">
                      {step.body}
                    </p>
                  </li>,
                  i < HOME_ORIENTATION_STEPS.length - 1 ? (
                    <li
                      key={`${step.title}-connector`}
                      aria-hidden="true"
                      role="presentation"
                      className={`hidden list-none items-center ${connectorColumn} md:flex`}
                    >
                      <span className="block h-px w-full border-t border-dashed border-stone/75" />
                    </li>
                  ) : null,
                ];
              })}
            </ol>
          </div>
        </section>
      ) : null}

      <HomeProofSplit />

      <HomeGiftBlock />

      {!compactHome ? <HomeStudioProof /> : null}

      <ProductQuickView open={quickViewSlug !== null} productSlug={quickViewSlug} onClose={() => setQuickViewSlug(null)} />

      {/* Invite — closing viewport emphasis; Ember primary CTA (second of two on page) */}
      <section
        aria-labelledby="home-invite-title"
        className="border-t border-stone/20 bg-papyrus px-4 py-24 sm:px-6 md:py-32 lg:px-8"
      >
        <div className="mx-auto max-w-lg">
          <div
            data-reveal
            className="warm-glow-glass rounded-2xl border-stone/35 px-6 py-14 text-center sm:px-10 sm:py-16 md:px-12 md:py-18"
          >
            <h2
              id="home-invite-title"
              className="font-headline text-xl font-medium leading-tight tracking-tight text-obsidian md:text-2xl"
            >
              {BRAND_COPY.mantra}
            </h2>
            <p data-reveal="stagger-1" className="mx-auto mt-4 max-w-md font-body text-sm leading-relaxed text-warm-charcoal md:text-[15px]">
              {HOME_COPY.inviteBody}
            </p>
            <Link
              data-reveal="stagger-2"
              to="/feelings"
              className="cta-clay font-body mt-8 inline-flex min-h-11 w-full max-w-xs items-center justify-center bg-primary px-8 py-3.5 text-sm font-medium text-obsidian transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-river sm:w-auto"
            >
              {copy.home.inviteCta}
            </Link>
            <form
              data-reveal="stagger-3"
              onSubmit={handleWaitlistSubmit}
              className="mx-auto mt-8 flex max-w-md flex-col gap-2 border border-stone/25 bg-glass-white/72 px-3 py-3 backdrop-blur-sm sm:flex-row sm:items-stretch"
            >
              <label htmlFor="home-waitlist-contact" className="sr-only">
                WhatsApp number or Email
              </label>
              <input
                id="home-waitlist-contact"
                type="text"
                value={waitlistContact}
                onChange={(event) => {
                  setWaitlistContact(event.target.value);
                  if (waitlistStatus !== 'idle') setWaitlistStatus('idle');
                }}
                className="min-h-11 flex-1 border border-transparent bg-papyrus px-3 font-body text-sm text-obsidian outline-none transition-colors placeholder:text-clay/70 focus:border-stone/40"
                placeholder="WhatsApp number or Email"
                aria-invalid={waitlistStatus === 'error'}
              />
              <button
                type="submit"
                className="font-label inline-flex min-h-11 items-center justify-center bg-obsidian px-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-clean-white transition-colors hover:bg-obsidian/90"
              >
                {HOME_COPY.waitlistSubmit}
              </button>
            </form>
            <p className="mx-auto mt-3 font-body text-xs text-clay/90 md:text-sm">
              {waitlistStatus === 'success'
                ? HOME_COPY.waitlistSuccess
                : waitlistStatus === 'error'
                  ? HOME_COPY.waitlistError
                  : HOME_COPY.waitlistNote}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
