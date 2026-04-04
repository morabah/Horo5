import { Link } from 'react-router-dom';
import { imgUrl, STOREFRONT_IMAGE_SLOTS } from '../data/images';

export function HomeHeroExplosive() {
  const heroVisual = STOREFRONT_IMAGE_SLOTS.home.hero;
  const isVectorHero = heroVisual.src.endsWith('.svg');
  const heroImgSrc = isVectorHero ? heroVisual.src : imgUrl(heroVisual.src, 1600);

  return (
    <header
      id="home-hero"
      className={`hero-bleed relative isolate min-h-dvh overflow-hidden bg-obsidian text-white ${isVectorHero ? 'hero-bleed--vector' : ''}`}
    >
      <div className="hero-bleed-fallback absolute inset-0 z-0" aria-hidden />

      <img
        alt={heroVisual.alt}
        className={`hero-bleed-img absolute inset-0 z-1 h-full w-full object-cover ${isVectorHero ? 'hero-bleed-img--vector' : ''}`}
        src={heroImgSrc}
        width={isVectorHero ? 2048 : 1600}
        height={isVectorHero ? 1638 : 1600}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        style={heroVisual.objectPosition ? { objectPosition: heroVisual.objectPosition } : undefined}
      />

      <div className="hero-bleed-scrim-base pointer-events-none absolute inset-0 z-2" aria-hidden />

      <div className="hero-bleed-scrim-read pointer-events-none absolute inset-0 z-4" aria-hidden />
      <div className="hero-bleed-grain pointer-events-none absolute inset-0 z-5" aria-hidden />

      <div className="hero-bleed-inner relative z-20 mx-auto flex min-h-dvh w-full max-w-[1440px] flex-col justify-end px-[max(1rem,env(safe-area-inset-left,0px))] pb-[max(2.25rem,calc(env(safe-area-inset-bottom,0px)+1.25rem))] pr-[max(1rem,env(safe-area-inset-right,0px))] pt-28 sm:px-6 sm:pb-[max(2rem,calc(env(safe-area-inset-bottom,0px)+1rem))] sm:pt-32 md:px-8 lg:px-10">
        <div className="hero-bleed-copy">
          <h1 className="hero-bleed-title font-headline">Characters, worlds, and stories you can wear.</h1>

          <div className="hero-bleed-actions">
            <Link
              to="/vibes"
              className="font-label inline-flex min-h-11 items-center justify-center border border-white/40 bg-white/5 px-8 py-3.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition-all duration-300 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
            >
              Explore the Collection
            </Link>
          </div>
        </div>
      </div>

      <div className="hero-bleed-vignette pointer-events-none absolute inset-0 z-14" aria-hidden />
    </header>
  );
}
