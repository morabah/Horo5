import { Link } from 'react-router-dom';
import { imgUrl, STOREFRONT_IMAGE_SLOTS } from '../data/images';
import { vibes } from '../data/site';

export function HomeHeroExplosive() {
  const heroVisual = STOREFRONT_IMAGE_SLOTS.home.hero;
  const heroFacts = ['220 GSM Cotton', `${vibes.length} Vibe Worlds`, 'Free Exchange'];

  return (
    <header id="home-hero" className="hero-stage relative isolate min-h-dvh overflow-hidden bg-obsidian text-white">
      <div className="hero-stage-backdrop absolute inset-0 z-0" aria-hidden />
      <div className="hero-grain pointer-events-none absolute inset-0 z-10 opacity-[0.05]" aria-hidden />

      <div className="hero-stage-shell relative z-20 mx-auto grid min-h-dvh w-full max-w-[1440px] grid-cols-1 items-center gap-12 px-[max(1rem,env(safe-area-inset-left,0px))] pb-[max(2.25rem,calc(env(safe-area-inset-bottom,0px)+1.25rem))] pr-[max(1rem,env(safe-area-inset-right,0px))] pt-28 sm:px-6 sm:pb-[max(2rem,calc(env(safe-area-inset-bottom,0px)+1rem))] sm:pt-32 md:px-8 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1fr)] lg:gap-10 lg:px-10">
        <div className="hero-stage-copy flex flex-col items-start pt-6 sm:pt-0">
          <h1 className="hero-stage-title font-headline">
            <span className="hero-stage-title-line hero-stage-title-line--light">Wear</span>
            <span className="hero-stage-title-line hero-stage-title-line--accent">What</span>
            <span className="hero-stage-title-line hero-stage-title-line--accent">You</span>
            <span className="hero-stage-title-line hero-stage-title-line--accent">Mean</span>
          </h1>

          <p className="hero-stage-body font-body">
            Heavyweight graphic tees for the days when you want the shirt to do the talking before you do.
          </p>

          <div className="hero-stage-actions w-full sm:w-auto">
            <Link
              to="/vibes"
              className="hero-stage-cta font-label inline-flex min-h-14 w-full items-center justify-center px-10 py-4 text-[13px] font-bold uppercase tracking-[0.22em] text-obsidian transition-all duration-300 hover:brightness-105 active:brightness-95 sm:w-auto"
            >
              Shop by Vibe
            </Link>
          </div>

          <div className="hero-stage-facts">
            {heroFacts.map((fact) => (
              <span key={fact} className="hero-stage-fact font-label">
                {fact}
              </span>
            ))}
          </div>
        </div>

        <div className="hero-stage-figure">
          <div className="hero-stage-figure-frame overflow-hidden">
            <img
              alt={heroVisual.alt}
              className="hero-model-img h-full w-full object-cover"
              src={imgUrl(heroVisual.src, 1200)}
              width={1200}
              height={1500}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              style={heroVisual.objectPosition ? { objectPosition: heroVisual.objectPosition } : undefined}
            />
            <div className="hero-stage-figure-scrim absolute inset-0 pointer-events-none" aria-hidden />

            <div className="hero-stage-note">
              <span className="hero-stage-note-label font-label">Quietly loud</span>
              <p className="font-body">
                Original art, heavyweight cotton, and a clean silhouette built for the first impression.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="hero-stage-vignette pointer-events-none absolute inset-0 z-30" aria-hidden />
    </header>
  );
}
