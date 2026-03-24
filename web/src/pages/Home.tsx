import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { VibeLookbook } from '../components/VibeLookbook';
import { getProductMedia, heroHomeTee, imgUrl } from '../data/images';
import { products, getArtist, getVibe } from '../data/site';

export function Home() {
  const latestDrops = products.slice(0, 4);

  /** Default to first product so server/initial client HTML match; randomize after mount to avoid hydration mismatch in SSR frameworks. */
  const [heroThumbProduct, setHeroThumbProduct] = useState(() => products[0] ?? null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (products.length > 0) {
      const randomIndex = Math.floor(Math.random() * products.length);
      setHeroThumbProduct(products[randomIndex]);
      setIsMounted(true);
    }
  }, []);

  const heroThumbSrc = heroThumbProduct ? getProductMedia(heroThumbProduct.slug).main : heroHomeTee;

  return (
    <>
      {/* Hero — §8.2 dark, cinematic, warm; md+ glass bottom-left; mobile-safe insets + short-viewport scroll */}
      <header className="relative flex min-h-dvh min-h-screen w-full flex-col justify-end overflow-hidden bg-obsidian pb-[max(2.5rem,calc(env(safe-area-inset-bottom,0px)+1rem))] pt-24 sm:pt-28 md:pb-16 md:pt-28 lg:pb-[max(5rem,calc(env(safe-area-inset-bottom,0px)+1.5rem))]">
        <div className="absolute inset-0">
          <img
            alt="Model wearing a HORO graphic tee in warm editorial photography"
            className="h-full w-full object-cover opacity-80"
            src={imgUrl(heroHomeTee, 1920)}
            width={1920}
            height={1080}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
        <div className="relative z-10 mx-auto w-full min-w-0 max-w-6xl pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] sm:pl-6 sm:pr-6 md:mx-auto md:max-w-7xl md:pl-8 md:pr-8 lg:pl-10 lg:pr-10">
          <div className="mx-auto flex min-w-0 max-w-xl flex-col items-center text-center md:mx-0 md:items-start md:text-left">
            <div className="hero-glass-backdrop relative max-h-[min(72dvh,calc(100dvh-10rem))] w-full max-w-xl overflow-y-auto overscroll-y-contain rounded-2xl px-5 py-6 [-webkit-overflow-scrolling:touch] sm:max-h-none sm:overflow-visible sm:px-8 sm:py-8 md:px-10 md:py-10">
              <h1 className="font-headline mb-4 text-balance text-[26px] font-semibold leading-[1.2] tracking-[-0.03em] text-white md:text-[32px]">
                Wear What You Mean
              </h1>
              <p className="font-body mx-auto mb-3 max-w-xl text-[17px] tracking-wide text-stone md:mx-0 md:text-[17px]">
                Find the design that says it for you.
              </p>
              <p className="font-body mx-auto mb-8 max-w-xl text-[14px] leading-relaxed text-stone/90 md:mx-0 md:text-[15px]">
                When nothing in your closet says what you&apos;re thinking.
              </p>
              <p className="font-label mb-8 text-xs font-medium uppercase tracking-[0.22em] text-stone">Starting at 799 EGP</p>
              <Link
                to="/vibes"
                className="home-hover-lift touch-manipulation font-label inline-flex min-h-12 w-full max-w-sm items-center justify-center rounded-sm bg-primary px-8 py-5 text-sm font-medium uppercase tracking-[0.2em] text-white shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:brightness-95 active:brightness-95 sm:inline-block sm:w-auto sm:px-12 md:max-w-none"
              >
                Find Your Design
              </Link>
              <p className="font-label mt-4 text-[10px] font-medium uppercase tracking-[0.3em] text-stone">
                COD Available | Free Exchange
              </p>
            </div>
          </div>
        </div>
        {heroThumbProduct ? (
          <Link
            to={`/products/${heroThumbProduct.slug}`}
            className={`glass-trust-badge home-hover-lift-featured touch-manipulation absolute bottom-[max(11rem,calc(env(safe-area-inset-bottom,0px)+8.5rem))] right-[max(0.75rem,env(safe-area-inset-right,0px))] z-20 flex h-32 w-24 min-h-[128px] min-w-[96px] flex-col overflow-hidden rounded-xl shadow-2xl ring-1 ring-white/15 transition-all duration-700 hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal active:brightness-95 sm:bottom-28 sm:right-[max(1rem,env(safe-area-inset-right,0px))] sm:h-36 sm:w-28 md:bottom-32 md:right-10 md:h-40 md:w-32 ${isMounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
            aria-label={`Featured tee: ${heroThumbProduct.name}`}
          >
            <div className="relative min-h-0 flex-1">
              <img
                alt=""
                className="h-full w-full object-cover"
                src={imgUrl(heroThumbSrc, 400)}
                width={160}
                height={200}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" aria-hidden />
            </div>
            <span className="font-label bg-black/40 px-2 py-1.5 text-center text-[9px] font-semibold uppercase tracking-[0.2em] text-frost-blue backdrop-blur-sm">
              Featured
            </span>
          </Link>
        ) : null}
        <div className="absolute bottom-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)+0.5rem))] left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 sm:bottom-10">
          <span className="font-label text-[10px] font-medium uppercase tracking-[0.3em] text-stone">The Narrative</span>
          <div className="h-12 w-px bg-stone/30" />
        </div>
      </header>

      {/* The Feeling */}
      <section className="bg-papyrus px-4 py-16 sm:px-6 sm:py-20 md:py-28 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-12 text-center">
          <h2 className="font-headline text-[19px] font-medium uppercase tracking-tight text-obsidian md:text-[22px] md:leading-[1.3]">
            You know that feeling?
          </h2>
          <div className="space-y-6">
            <p className="font-body text-[24px] font-light leading-tight text-warm-charcoal md:text-[36px] md:leading-[1.2]">
              When nothing in your closet says what you&apos;re actually thinking.
            </p>
            <p className="font-body text-[17px] italic text-deep-teal md:text-[17px]">We get it. That&apos;s why we&apos;re here.</p>
          </div>
        </div>
      </section>

      {/* Find your vibe — unified lookbook (cards expand editorial inline) */}
      <VibeLookbook />

      {/* Trust — scroll spy clears vibe label in nav when this enters view */}
      <section className="bg-obsidian px-4 py-20 sm:px-6 md:py-32 lg:px-8" data-home-end-vibes>
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: 'layers', title: '220 GSM Cotton', sub: 'Heavyweight feel that keeps its shape' },
            { icon: 'verified', title: 'Original Licensed Design', sub: 'Clearly credited and properly sourced' },
            { icon: 'history', title: 'Free Exchange 14 Days', sub: 'Less sizing stress, easier decisions' },
            { icon: 'payments', title: 'COD Available', sub: 'Pay at your doorstep' },
          ].map((item) => (
            <div key={item.title} className="glass-trust-badge flex flex-col items-center space-y-6 px-6 py-10">
              <span className="material-symbols-outlined text-4xl text-white">{item.icon}</span>
              <div className="text-center">
                <span className="font-label block text-[11px] font-medium uppercase tracking-[0.3em] text-frost-blue">{item.title}</span>
                <span className="mt-1 block text-[10px] text-stone">{item.sub}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stories */}
      <section className="bg-papyrus px-4 py-20 sm:px-6 md:py-32 lg:px-8 lg:py-40">
        <div className="mx-auto max-w-7xl">
          <div className="mb-20 text-center">
            <span className="font-headline text-[12px] font-medium uppercase tracking-[0.5em] text-label">You completed it</span>
          </div>
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
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
                className={`warm-glow-glass space-y-8 p-8 ${i === 1 ? 'md:mt-16' : ''} ${i === 2 ? 'md:mt-32' : ''}`}
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

      {/* Latest drop */}
      <section className="border-t border-label/10 bg-papyrus px-4 py-20 sm:px-6 md:py-32 lg:px-8 lg:py-40">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 flex flex-col gap-4 sm:mb-24 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="font-headline text-[22px] font-medium tracking-tight text-obsidian md:text-4xl md:leading-[1.3]">Just Dropped</h2>
            <Link
              to="/vibes"
              className="font-label min-h-12 border-b border-obsidian pb-1 text-xs font-medium uppercase tracking-widest text-label transition-colors hover:text-deep-teal"
            >
              View All
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-x-10 gap-y-24 sm:grid-cols-2 lg:grid-cols-4">
            {latestDrops.map((p) => {
              const artist = getArtist(p.artistSlug);
              const vibe = getVibe(p.vibeSlug);
              const main = getProductMedia(p.slug).main;
              return (
                <article key={p.slug} className="group home-latest-product">
                  <Link to={`/products/${p.slug}`} className="block cursor-pointer">
                    <div className="editorial-shadow mb-6 aspect-[3/4] overflow-hidden rounded-sm bg-surface-container-high">
                      <img
                        alt={`HORO “${p.name}” tee — on-body`}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        src={imgUrl(main, 800)}
                        loading="lazy"
                      />
                    </div>
                  </Link>
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <p className="font-headline text-xl font-bold text-obsidian">EGP {p.priceEgp.toLocaleString('en-EG')}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex flex-col gap-1">
                        <p className="font-label text-[9px] font-medium uppercase tracking-[0.2em] text-clay">{vibe?.name ?? ''}</p>
                        <Link to={`/products/${p.slug}`}>
                          <h3 className="font-headline text-2xl font-bold text-obsidian transition-colors hover:text-deep-teal sm:text-3xl">{p.name}</h3>
                        </Link>
                        <p className="font-body text-[11px] uppercase tracking-[0.18em] text-secondary/80">
                          Illustrated by {artist?.name ?? 'HORO Studio'}
                        </p>
                      </div>
                    </div>
                    <p className="font-body max-w-prose text-sm leading-relaxed text-clay">{p.story}</p>
                    <Link
                      to={`/products/${p.slug}`}
                      className="home-hover-lift font-label mt-2 flex min-h-12 w-full items-center justify-center rounded-sm border border-primary/30 bg-primary px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-obsidian shadow-sm transition-all hover:scale-[1.01] hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                    >
                      Shop now — EGP {p.priceEgp.toLocaleString('en-EG')}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Invite */}
      <section className="border-t border-label/10 bg-papyrus px-4 py-24 text-center sm:px-6 md:py-40 lg:px-8 lg:py-60">
        <div className="mx-auto max-w-4xl space-y-10 sm:space-y-16">
          <h2 className="font-headline text-[clamp(1.75rem,6vw,3rem)] font-medium leading-tight tracking-tighter text-obsidian md:text-[48px] md:leading-[1.2]">
            Find your word.
          </h2>
          <Link
            to="/vibes"
            className="home-hover-lift font-label inline-flex min-h-12 w-full max-w-sm items-center justify-center rounded-sm bg-primary px-10 py-6 text-sm font-medium uppercase tracking-[0.25em] text-obsidian shadow-xl transition-all duration-500 hover:scale-105 hover:brightness-95 sm:inline-block sm:w-auto sm:max-w-none sm:px-16"
          >
            Find Your Design
          </Link>
        </div>
      </section>
    </>
  );
}
