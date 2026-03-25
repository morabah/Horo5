import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ProductQuickView } from '../components/ProductQuickView';
import { HomeVibeGrid } from '../components/HomeVibeGrid';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { formatEgp } from '../utils/formatPrice';
import { getProductMedia, heroHomeTee, imgUrl } from '../data/images';
import { getVibe, products } from '../data/site';
import { BRAND_TRUST_POINTS, PDP_SCHEMA } from '../data/domain-config';

/** Material Symbols per StoryBrand step (Problem 5): vibe → design → delivery */
const STORY_PLAN_STEP_ICONS = ['explore', 'checkroom', 'local_shipping'] as const;

const HOME_QUOTES = [
  {
    quote: 'Finally, a shirt that feels like a conversation starter without me having to say a word.',
    name: 'Omar K.',
    city: 'Cairo',
  },
  {
    quote: 'The quality of the cotton is insane. 220 GSM makes such a difference in how it hangs.',
    name: 'Sarah M.',
    city: 'Alexandria',
  },
  {
    quote: "Horo isn't just clothing; it's a mood. I own three pieces and they're all I wear now.",
    name: 'Yassin A.',
    city: 'Giza',
  },
] as const;

export function Home() {
  useScrollReveal();
  const [searchParams, setSearchParams] = useSearchParams();
  const latestDrops = products.slice(0, 4);
  const bridgeImage = getProductMedia(latestDrops[1].slug).main;
  const [quickViewSlug, setQuickViewSlug] = useState<string | null>(null);

  useEffect(() => {
    const vibeParam = searchParams.get('vibe');
    if (!vibeParam || !getVibe(vibeParam)) return;

    const id = `vibe-${vibeParam}`;
    const t = window.setTimeout(() => {
      const el = document.getElementById(id);
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete('vibe');
          return next;
        },
        { replace: true },
      );
    }, 120);

    return () => window.clearTimeout(t);
  }, [searchParams, setSearchParams]);

  return (
    <>
      {/* Hero — image-dominant: text overlay + bottom scrim only (Guidelines §8.1) */}
      <header
        id="home-hero"
        className="relative flex min-h-dvh w-full flex-col justify-end overflow-hidden bg-obsidian pb-[max(5rem,calc(env(safe-area-inset-bottom,0px)+1.75rem))] pt-24 sm:pt-28 md:pb-12 md:pt-28"
      >
        <div className="absolute inset-0">
          <img
            alt="Model wearing a HORO graphic tee in warm editorial photography"
            className="h-full w-full object-cover"
            src={imgUrl(heroHomeTee, 1920)}
            width={1920}
            height={1080}
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/75 via-black/25 to-black/30" aria-hidden />
        <div className="relative z-10 mx-auto w-full min-w-0 max-w-6xl px-[max(1rem,env(safe-area-inset-left,0px))] pb-2 pr-[max(1rem,env(safe-area-inset-right,0px))] sm:px-6 md:max-w-7xl md:px-8 lg:px-10">
          <div className="mx-auto flex min-w-0 max-w-xl flex-col items-center text-center md:mx-0 md:max-w-lg md:items-start md:text-left">
            <h1 className="hero-overlay-heading font-headline mb-4 text-balance text-[26px] font-semibold leading-[1.15] tracking-[-0.03em] text-white md:text-[32px] lg:text-[36px]">
              Wear What You Mean
            </h1>
            <p className="hero-overlay-sub font-body mb-6 max-w-xl text-[17px] leading-snug text-white md:mb-7">
              Find the design that says it for you.
            </p>
            <Link
              to="/vibes"
              className="home-hover-lift touch-manipulation font-label inline-flex min-h-12 w-full max-w-sm items-center justify-center rounded-sm bg-primary px-8 py-5 text-sm font-medium uppercase tracking-[0.2em] text-obsidian shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:brightness-95 active:brightness-95 sm:inline-block sm:w-auto sm:px-12"
            >
              Find Your Vibe
            </Link>
            <p className="hero-overlay-ribbon font-label mt-6 max-w-xl text-[11px] font-medium uppercase leading-relaxed tracking-[0.18em] text-white/90 md:mt-7 md:text-[12px] md:tracking-[0.22em]">
              Starting at {formatEgp(799)}
              <span className="mx-2 text-white/50" aria-hidden>
                |
              </span>
              COD Available
              <span className="mx-2 text-white/50" aria-hidden>
                |
              </span>
              Free Exchange
            </p>
          </div>
        </div>
      </header>

      <div
        className="pointer-events-none -mt-px h-12 w-full bg-linear-to-b from-obsidian via-[#2a2826] to-papyrus sm:h-14"
        aria-hidden
      />

      {/* The Feeling */}
      <section className="relative overflow-hidden bg-papyrus px-4 pb-8 pt-8 sm:px-6 sm:pb-10 md:pb-12 md:pt-12 lg:px-8">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 18% 18%, rgba(196, 149, 106, 0.08) 0%, transparent 55%), radial-gradient(ellipse at 82% 30%, rgba(232, 89, 60, 0.05) 0%, transparent 50%)',
          }}
          aria-hidden
        />
        <div className="mx-auto grid max-w-6xl items-center gap-6 md:gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
          <div className="max-w-3xl" data-reveal>
            <h2 className="font-headline text-[17px] font-medium uppercase tracking-[0.18em] text-obsidian md:text-[19px]">
              You know that feeling?
            </h2>
            <p className="font-body mt-4 max-w-4xl text-[18px] font-light leading-tight text-warm-charcoal sm:text-[24px] md:text-[34px] md:leading-[1.15]">
              When nothing in your closet says what you&apos;re actually thinking.
            </p>
            <p className="font-body mt-4 text-[17px] italic text-clay">We get it. That&apos;s why we&apos;re here.</p>
          </div>
          <div data-reveal="stagger-1" className="mx-auto w-full max-w-sm lg:mx-0 lg:max-w-none">
            <div className="editorial-shadow relative aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-surface-container-high">
              <img alt="Model wearing a HORO graphic tee in studio light" className="h-full w-full object-cover" src={imgUrl(bridgeImage, 960)} loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      <HomeVibeGrid />

      {/* StoryBrand simple plan (domain-config storyPlanSteps) */}
      <section className="bg-papyrus px-4 pb-8 sm:px-6 sm:pb-10 lg:px-8">
        <div className="mx-auto max-w-[1400px]">
          <ol className="grid grid-cols-1 gap-3 border-y border-label/10 py-5 md:grid-cols-3 md:gap-5" data-reveal>
            {PDP_SCHEMA.storyPlanSteps.map((step, i) => (
              <li
                key={step}
                className="flex items-center gap-4 rounded-2xl px-2 py-2 md:justify-center"
                data-reveal={(['stagger-1', 'stagger-2', 'stagger-3'] as const)[i]}
              >
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/6 text-primary">
                  <span className="material-symbols-outlined text-[22px]" aria-hidden>
                    {STORY_PLAN_STEP_ICONS[i]}
                  </span>
                </span>
                <span className="font-label text-[11px] uppercase tracking-[0.22em] text-label md:text-[12px]">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Trust row */}
      <section className="bg-papyrus px-4 pb-12 sm:px-6 sm:pb-14 lg:px-8">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {BRAND_TRUST_POINTS.map((item, i) => (
            <div
              key={item.title}
              data-reveal={(['stagger-1', 'stagger-2', 'stagger-3', 'stagger-4'] as const)[i]}
              className="flex items-start gap-4 rounded-[1.5rem] border border-label/10 bg-white/55 px-5 py-5 shadow-[0_12px_32px_rgba(26,26,26,0.05)] backdrop-blur-sm"
            >
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-obsidian text-white">
                <span className="material-symbols-outlined text-[21px]" aria-hidden>
                  {item.icon}
                </span>
              </span>
              <div className="min-w-0">
                <span className="font-label block text-[11px] font-semibold uppercase tracking-[0.2em] text-label">{item.title}</span>
                <span className="mt-1 block text-sm leading-relaxed text-warm-charcoal">{item.sub}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stories */}
      <section className="bg-papyrus px-4 pb-14 pt-2 sm:px-6 md:pb-16 lg:px-8 lg:pb-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 text-center md:mb-10" data-reveal>
            <span className="font-headline text-[12px] font-medium uppercase tracking-[0.36em] text-label">You completed it</span>
          </div>
          <div className="-mx-4 flex gap-4 overflow-x-auto overflow-y-hidden px-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory md:mx-0 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0 md:pb-0 md:snap-none [&::-webkit-scrollbar]:hidden">
            {HOME_QUOTES.map((t, i) => (
              <div
                key={t.name}
                data-reveal={(['stagger-1', 'stagger-2', 'stagger-3'] as const)[i]}
                className="warm-glow-glass w-[85vw] max-w-sm shrink-0 snap-center space-y-6 rounded-[1.5rem] p-6 md:w-auto md:max-w-none md:shrink md:snap-none"
              >
                <p className="font-body text-[17px] italic leading-relaxed text-warm-charcoal md:text-[19px]">&ldquo;{t.quote}&rdquo;</p>
                <div className="h-px w-12 bg-desert-sand/40" />
                <div className="font-headline text-[14px] font-medium uppercase tracking-widest text-clay">
                  — {t.name}
                  <span className="font-body block text-[13px] font-normal normal-case tracking-normal text-clay/80">{t.city}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ProductQuickView open={quickViewSlug !== null} productSlug={quickViewSlug} onClose={() => setQuickViewSlug(null)} />

      {/* Latest drop */}
      <section className="border-t border-label/10 bg-papyrus px-4 py-14 sm:px-6 md:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col gap-4 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
            <h2 data-reveal className="font-headline text-[22px] font-medium tracking-tight text-obsidian md:text-[28px] md:leading-[1.3]">
              Just Dropped
            </h2>
            <Link
              data-reveal="stagger-1"
              to="/vibes"
              className="font-label inline-flex min-h-12 w-fit items-center justify-center rounded-sm border-2 border-obsidian/90 bg-transparent px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-obsidian transition-colors hover:border-deep-teal hover:text-deep-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
            >
              View All
            </Link>
          </div>
          <div className="grid grid-cols-1 items-stretch gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {latestDrops.map((p, i) => {
              const vibe = getVibe(p.vibeSlug);
              const main = getProductMedia(p.slug).main;
              return (
                <article
                  key={p.slug}
                  data-reveal={(['stagger-1', 'stagger-2', 'stagger-3', 'stagger-4'] as const)[i]}
                  className="group home-latest-product relative flex h-full flex-col"
                >
                  <div className="flex h-full min-h-0 flex-1 flex-col">
                    <div className="relative mb-5 shrink-0">
                      <Link
                        to={`/products/${p.slug}`}
                        className="block rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                        aria-label={`View ${p.name}`}
                      >
                        <span className="sr-only">
                          {p.name}
                          {vibe?.name ? `, ${vibe.name}` : ''}, {formatEgp(p.priceEgp)}
                        </span>
                        <div className="editorial-shadow relative aspect-3/4 overflow-hidden rounded-sm bg-surface-container-high">
                          {p.merchandisingBadge ? (
                            <span className="font-label glass-merchandising-badge absolute left-3 top-3 z-10 rounded px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-label">
                              {p.merchandisingBadge}
                            </span>
                          ) : null}
                          <img
                            alt={`HORO “${p.name}” graphic tee`}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            src={imgUrl(main, 800)}
                            loading="lazy"
                          />
                        </div>
                      </Link>
                      <button
                        type="button"
                        className="quick-view-pill quick-view-pill--compact quick-view-pill--hover font-label absolute bottom-3 right-3 z-10 hidden min-h-11 items-center justify-center rounded-full px-4 py-3 text-center text-[11px] font-medium uppercase tracking-[0.2em] text-obsidian transition-shadow hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal md:inline-flex"
                        onClick={() => setQuickViewSlug(p.slug)}
                        aria-label={`Quick view: ${p.name}`}
                      >
                        Quick view
                      </button>
                    </div>
                    <div className="flex min-h-0 flex-1 flex-col text-left">
                      <p className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-clay">{vibe?.name ?? ''}</p>
                      <Link
                        to={`/products/${p.slug}`}
                        className="font-headline mt-3 text-[17px] font-medium leading-snug text-obsidian transition-colors hover:text-deep-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                      >
                        {p.name}
                      </Link>
                      <p className="font-body mt-3 line-clamp-2 min-h-0 flex-1 max-w-prose text-sm leading-relaxed text-warm-charcoal">
                        {p.story}
                      </p>
                      <div className="mt-auto flex items-center justify-between gap-4 pt-4">
                        <p className="font-headline text-[17px] font-semibold text-obsidian">{formatEgp(p.priceEgp)}</p>
                        <button
                          type="button"
                          className="font-label inline-flex min-h-11 items-center justify-center text-[11px] uppercase tracking-[0.2em] text-clay transition-colors hover:text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal md:hidden"
                          onClick={() => setQuickViewSlug(p.slug)}
                          aria-label={`Quick view: ${p.name}`}
                        >
                          Quick view
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Invite */}
      <section className="border-t border-label/10 bg-papyrus px-4 py-16 text-center sm:px-6 md:py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-4xl space-y-8 sm:space-y-10">
          <h2 data-reveal className="font-headline text-[22px] font-medium leading-tight tracking-tighter text-obsidian md:text-[32px] md:leading-[1.2]">
            Find your word.
          </h2>
          <Link
            data-reveal="stagger-1"
            to="/vibes"
            className="home-hover-lift font-label inline-flex min-h-12 w-full max-w-sm items-center justify-center rounded-sm bg-primary px-10 py-6 text-sm font-medium uppercase tracking-[0.25em] text-obsidian shadow-xl transition-all duration-300 hover:scale-[1.03] hover:brightness-95 active:scale-95 sm:inline-block sm:w-auto sm:max-w-none sm:px-16"
          >
            Find Your Vibe
          </Link>
        </div>
      </section>
    </>
  );
}
