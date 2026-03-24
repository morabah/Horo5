import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ProductQuickView } from '../components/ProductQuickView';
import { HomeVibeGrid } from '../components/HomeVibeGrid';
import { SectionDivider } from '../components/SectionDivider';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { formatEgp } from '../utils/formatPrice';
import { getProductMedia, heroHomeTee, imgUrl } from '../data/images';
import { getVibe, products } from '../data/site';

export function Home() {
  useScrollReveal();
  const [searchParams, setSearchParams] = useSearchParams();
  const latestDrops = products.slice(0, 4);

  /** Default to first product so server/initial client HTML match; randomize after mount to avoid hydration mismatch in SSR frameworks. */
  const [heroThumbProduct, setHeroThumbProduct] = useState(() => products[0] ?? null);
  const [isMounted, setIsMounted] = useState(false);
  const [quickViewSlug, setQuickViewSlug] = useState<string | null>(null);

  useEffect(() => {
    if (products.length > 0) {
      const randomIndex = Math.floor(Math.random() * products.length);
      setHeroThumbProduct(products[randomIndex]);
      setIsMounted(true);
    }
  }, []);

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

  const heroThumbSrc = heroThumbProduct ? getProductMedia(heroThumbProduct.slug).main : heroHomeTee;

  return (
    <>
      {/* Hero — §8.2 dark, cinematic, warm; md+ glass bottom-left; mobile-safe insets + short-viewport scroll */}
      <header className="relative flex min-h-dvh w-full flex-col justify-end overflow-hidden bg-obsidian pb-[max(6rem,calc(env(safe-area-inset-bottom,0px)+2rem))] pt-24 sm:pt-28 md:pb-16 md:pt-28 lg:pb-[max(5rem,calc(env(safe-area-inset-bottom,0px)+1.5rem))]">
        <div className="absolute inset-0">
          <img
            alt="Model wearing a HORO graphic tee in warm editorial photography"
            className="h-full w-full object-cover opacity-80"
            src={imgUrl(heroHomeTee, 1920)}
            width={1920}
            height={1080}
          />
        </div>
        <div className="absolute inset-0 bg-linear-to-b from-black/40 via-transparent to-black/60" />
        <div className="relative z-10 mx-auto w-full min-w-0 max-w-6xl pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] sm:pl-6 sm:pr-6 md:mx-auto md:max-w-7xl md:pl-8 md:pr-8 lg:pl-10 lg:pr-10">
          <div className="mx-auto flex min-w-0 max-w-xl flex-col items-center text-center md:mx-0 md:items-start md:text-left">
            <div className="hero-glass-backdrop hero-glass-tight relative w-full max-w-xl rounded-2xl px-5 py-6 sm:px-8 sm:py-8 md:max-w-lg md:px-8 md:py-8 lg:px-10 lg:py-9">
              <h1 className="hero-glass-tight-heading font-headline mb-4 text-balance text-[26px] font-semibold leading-[1.2] tracking-[-0.03em] text-white md:text-[32px]">
                Wear What You Mean
              </h1>
              <p className="hero-glass-tight-lead font-body mx-auto mb-3 max-w-xl text-[17px] tracking-wide text-stone md:mx-0 md:hidden">
                Find the design that says it for you.
              </p>
              <p className="hero-glass-tight-sub font-body mx-auto mb-8 max-w-xl px-0.5 text-[15px] leading-relaxed text-stone/90 md:mx-0 md:hidden">
                When nothing in your closet says what you&apos;re thinking.
              </p>
              <p className="font-body mx-auto mb-8 hidden max-w-xl text-[15px] leading-relaxed text-stone md:mx-0 md:mb-6 md:block">
                Find the design that says it for you — when nothing in your closet says what you&apos;re thinking.
              </p>
              <p className="hero-glass-tight-price font-label mb-8 text-xs font-medium uppercase tracking-[0.22em] text-stone">
                Starting at {formatEgp(799)}
              </p>
              <Link
                to="/vibes"
                className="hero-glass-tight-cta home-hover-lift touch-manipulation font-label inline-flex min-h-12 w-full max-w-sm items-center justify-center rounded-sm bg-primary px-8 py-5 text-sm font-medium uppercase tracking-[0.2em] text-obsidian shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:brightness-95 active:brightness-95 sm:inline-block sm:w-auto sm:px-12 md:max-w-none"
              >
                Find Your Design
              </Link>
              <p className="hero-glass-tight-trust font-label mt-4 text-[12px] font-medium uppercase tracking-[0.28em] text-stone md:text-[11px] md:tracking-[0.3em]">
                COD Available | Free Exchange
              </p>
            </div>
            {heroThumbProduct ? (
              <Link
                to={`/products/${heroThumbProduct.slug}`}
                className={`glass-trust-badge home-hover-lift-featured touch-manipulation relative z-20 mt-5 flex h-28 w-[5.75rem] min-h-[112px] min-w-[92px] shrink-0 flex-col overflow-hidden rounded-xl shadow-2xl ring-1 ring-white/15 transition-opacity duration-700 hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal active:brightness-95 md:absolute md:mt-0 md:h-40 md:w-32 md:min-h-[160px] md:min-w-[128px] md:max-w-none md:rounded-xl md:bottom-[max(7rem,calc(env(safe-area-inset-bottom,0px)+5.5rem))] md:right-[max(1rem,env(safe-area-inset-right,0px))] lg:bottom-32 lg:right-10 ${isMounted ? 'opacity-100' : 'opacity-0'}`}
                aria-label={`Featured tee: ${heroThumbProduct.name}`}
              >
                <div className="hero-featured-thumb-float flex min-h-0 flex-1 flex-col">
                  <div className="relative min-h-0 flex-1">
                    <img
                      alt={heroThumbProduct ? `HORO “${heroThumbProduct.name}” graphic tee — featured` : 'Featured HORO tee'}
                      className="h-full w-full object-cover"
                      src={imgUrl(heroThumbSrc, 400)}
                      width={160}
                      height={200}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent" aria-hidden />
                  </div>
                  <span className="font-label bg-black/40 px-2 py-1.5 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-frost-blue backdrop-blur-sm">
                    Featured
                  </span>
                </div>
              </Link>
            ) : null}
          </div>
        </div>
        <div className="absolute bottom-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)+0.5rem))] left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 sm:bottom-10">
          <span className="font-label text-[11px] font-medium uppercase tracking-[0.3em] text-stone">The Narrative</span>
          <div className="hero-scroll-cue h-12 w-px bg-stone/30" />
        </div>
      </header>

      <div
        className="pointer-events-none -mt-px h-16 w-full bg-linear-to-b from-obsidian via-[#2a2826] to-papyrus sm:h-20"
        aria-hidden
      />

      <SectionDivider variant="heroFlow" />

      {/* The Feeling */}
      <section className="relative overflow-hidden bg-papyrus px-4 py-20 sm:px-6 sm:py-24 md:py-32 lg:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-b from-obsidian/15 to-transparent mix-blend-multiply opacity-60" aria-hidden />
        {/* F1 — Warm radial gradient texture to maintain visual momentum after the hero */}
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(196, 149, 106, 0.08) 0%, transparent 70%), radial-gradient(ellipse at 70% 80%, rgba(232, 89, 60, 0.04) 0%, transparent 60%)' }} aria-hidden />
        <div className="mx-auto max-w-4xl space-y-14 text-center md:space-y-16">
          <h2
            data-reveal
            className="font-headline text-[19px] font-medium uppercase tracking-tight text-obsidian md:text-[22px] md:leading-[1.3]"
          >
            You know that feeling?
          </h2>
          <div className="space-y-6" data-reveal="stagger-1">
            <p className="font-body text-[18px] font-light leading-tight text-warm-charcoal md:text-[36px] md:leading-[1.2]">
              When nothing in your closet says what you&apos;re actually thinking.
            </p>
            <p className="font-body text-[17px] italic text-clay md:text-[17px]">We get it. That&apos;s why we&apos;re here.</p>
          </div>
        </div>
      </section>

      <HomeVibeGrid />

      {/* Latest drop — directly after Find your vibe */}
      <section className="border-t border-label/10 bg-papyrus px-4 py-20 sm:px-6 md:py-32 lg:px-8 lg:py-40">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 flex flex-col gap-4 sm:mb-24 sm:flex-row sm:items-end sm:justify-between">
            <h2 data-reveal className="font-headline text-[22px] font-medium tracking-tight text-obsidian md:text-[28px] md:leading-[1.3]">
              Just Dropped
            </h2>
            <Link
              data-reveal="stagger-1"
              to="/vibes"
              className="font-label min-h-12 border-b border-obsidian pb-1 text-xs font-medium uppercase tracking-widest text-label transition-colors hover:text-deep-teal"
            >
              View All
            </Link>
          </div>
          <div className="grid grid-cols-1 items-stretch gap-x-10 gap-y-24 sm:grid-cols-2 lg:grid-cols-4">
            {latestDrops.map((p, i) => {
              const vibe = getVibe(p.vibeSlug);
              const main = getProductMedia(p.slug).main;
              return (
                <article
                  key={p.slug}
                  data-reveal={(['stagger-1', 'stagger-2', 'stagger-3', 'stagger-4'] as const)[i]}
                  className="group home-latest-product relative flex h-full flex-col"
                >
                  <Link
                    to={`/products/${p.slug}`}
                    className="absolute inset-0 z-1 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                  >
                    <span className="sr-only">
                      {p.name}
                      {vibe?.name ? `, ${vibe.name}` : ''}, {formatEgp(p.priceEgp)}
                    </span>
                  </Link>
                  <div className="relative z-2 flex h-full min-h-0 flex-1 flex-col pointer-events-none">
                    <div className="relative mb-6 shrink-0">
                      <div className="editorial-shadow relative aspect-3/4 overflow-hidden rounded-sm bg-surface-container-high">
                        {p.merchandisingBadge ? (
                          <span className="font-label glass-merchandising-badge absolute left-3 top-3 z-10 rounded px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-label">
                            {p.merchandisingBadge}
                          </span>
                        ) : null}
                        <img
                          alt=""
                          aria-hidden
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          src={imgUrl(main, 800)}
                          loading="lazy"
                        />
                      </div>
                      <button
                        type="button"
                        className="quick-view-pill font-label pointer-events-auto absolute bottom-3 left-3 right-3 z-10 min-h-12 rounded-full px-4 py-3 text-center text-xs font-medium uppercase tracking-[0.2em] text-obsidian opacity-100 shadow-md transition-[opacity,box-shadow] duration-200 hover:shadow-lg focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
                        onClick={() => setQuickViewSlug(p.slug)}
                      >
                        Quick view
                      </button>
                    </div>
                    <div className="flex min-h-0 flex-1 flex-col text-left">
                      <p className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-clay">{vibe?.name ?? ''}</p>
                      <h3 className="font-headline mt-3 text-[17px] font-medium leading-snug text-obsidian">{p.name}</h3>
                      <p className="font-body mt-3 line-clamp-3 min-h-0 flex-1 max-w-prose text-sm leading-relaxed text-warm-charcoal">
                        {p.story}
                      </p>
                      <p className="font-headline mt-auto pt-4 text-[17px] font-semibold text-obsidian">{formatEgp(p.priceEgp)}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <SectionDivider variant="latestFunnel" />

      <ProductQuickView open={quickViewSlug !== null} productSlug={quickViewSlug} onClose={() => setQuickViewSlug(null)} />

      <section className="relative bg-linear-to-b from-papyrus via-[#2a2826] to-obsidian px-4 pb-20 pt-12 sm:px-6 sm:pb-24 sm:pt-16 md:pb-32 md:pt-20 lg:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b from-papyrus to-transparent opacity-90" aria-hidden />
        <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: 'layers', title: '220 GSM Cotton', sub: 'Heavyweight feel that keeps its shape' },
            { icon: 'verified', title: 'Original Licensed Design', sub: 'Clearly credited and properly sourced' },
            { icon: 'history', title: 'Free Exchange 14 Days', sub: 'Less sizing stress, easier decisions' },
            { icon: 'payments', title: 'COD Available', sub: 'Pay at your doorstep' },
          ].map((item, i) => (
            <div
              key={item.title}
              data-reveal={(['stagger-1', 'stagger-2', 'stagger-3', 'stagger-4'] as const)[i]}
              className="glass-trust-badge flex flex-col items-center space-y-6 px-6 py-10"
            >
              <span className="material-symbols-outlined text-4xl text-white">{item.icon}</span>
              <div className="text-center">
                <span className="font-label block text-xs font-semibold uppercase tracking-[0.3em] text-frost-blue">{item.title}</span>
                <span className="mt-1 block text-[11px] text-white/70">{item.sub}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <SectionDivider variant="trustDiamond" />

      {/* Stories */}
      <section className="bg-papyrus px-4 py-20 sm:px-6 md:py-32 lg:px-8 lg:py-40">
        <div className="mx-auto max-w-7xl">
          <div className="mb-20 text-center" data-reveal>
            <span className="font-headline text-[13px] font-medium uppercase tracking-[0.5em] text-label">The HORO community</span>
          </div>
          <div className="-mx-4 flex gap-4 overflow-x-auto overflow-y-hidden px-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory md:mx-0 md:grid md:grid-cols-3 md:gap-8 md:overflow-visible md:pb-0 md:snap-none [&::-webkit-scrollbar]:hidden">
            {[
              {
                quote:
                  'Finally, a shirt that feels like a conversation starter without me having to say a word.',
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
            ].map((t, i) => (
              <div
                key={t.name}
                data-reveal={(['stagger-1', 'stagger-2', 'stagger-3'] as const)[i]}
                className={`warm-glow-glass w-[85vw] max-w-sm shrink-0 snap-center space-y-8 p-8 md:w-auto md:max-w-none md:shrink md:snap-none ${i === 1 ? 'md:mt-16' : ''} ${i === 2 ? 'md:mt-32' : ''}`}
              >
                <p className="font-body text-[17px] italic leading-relaxed text-warm-charcoal md:text-xl">&ldquo;{t.quote}&rdquo;</p>
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

      {/* Invite */}
      <section className="border-t border-label/10 bg-papyrus px-4 py-24 text-center sm:px-6 md:py-40 lg:px-8 lg:py-60">
        <div className="mx-auto max-w-4xl space-y-10 sm:space-y-16">
          <h2 data-reveal className="font-headline text-[22px] font-medium leading-tight tracking-tighter text-obsidian md:text-[32px] md:leading-[1.2]">
            Find your word.
          </h2>
          <Link
            data-reveal="stagger-1"
            to="/vibes"
            className="home-hover-lift font-label inline-flex min-h-12 w-full max-w-sm items-center justify-center rounded-sm bg-primary px-10 py-6 text-sm font-medium uppercase tracking-[0.25em] text-obsidian shadow-xl transition-all duration-300 hover:scale-[1.03] hover:brightness-95 active:scale-95 sm:inline-block sm:w-auto sm:max-w-none sm:px-16"
          >
            Find Your Design
          </Link>
        </div>
      </section>
    </>
  );
}
