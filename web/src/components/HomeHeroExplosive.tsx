import { Link } from 'react-router-dom';
import { formatEgp } from '../utils/formatPrice';
import { imgUrl, STOREFRONT_IMAGE_SLOTS } from '../data/images';
import { vibes } from '../data/site';

/**
 * Explosive split-typography hero — Gen Z editorial energy.
 * "WEAR" huge white rotated left, "WHAT YOU MEAN" cascading ember-red right,
 * model cutout overlapping, film grain overlay, glitch-on-load.
 * All content schema-driven (storefront slots, formatEgp, vibes count).
 */
export function HomeHeroExplosive() {
  const heroVisual = STOREFRONT_IMAGE_SLOTS.home.hero;

  return (
    <header
      id="home-hero"
      className="group relative flex min-h-dvh w-full flex-col justify-end overflow-hidden bg-obsidian"
    >
      {/* Film noise overlay */}
      <div className="hero-grain pointer-events-none absolute inset-0 z-30 opacity-[0.045]" aria-hidden />

      {/* Model photo — full-bleed cinematic treatment */}
      <div className="absolute inset-0 z-10">
        <img
          alt={heroVisual.alt}
          className="hero-model-img h-full w-full object-cover"
          src={imgUrl(heroVisual.src, 1920)}
          width={1920}
          height={1080}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          style={{
            ...(heroVisual.objectPosition ? { objectPosition: heroVisual.objectPosition } : {}),
            mixBlendMode: 'luminosity',
          }}
        />
        {/* Dark cinematic scrim — fuses photo into obsidian */}
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/60 to-obsidian/40" />
      </div>

      {/* Split typography — Mobile: Top/Bottom Stacking | Desktop: Left/Right Split */}
      <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between px-4 pb-[22rem] pt-32 sm:flex-row sm:items-center sm:p-0 sm:px-8 lg:px-12">
        {/* Desktop Animated Line Accent (Horizontal Swoosh) */}
        <svg 
          className="hidden sm:block absolute left-[30%] top-1/2 z-0 h-48 w-[40vw] -translate-y-1/2 -rotate-6 transform opacity-90" 
          viewBox="0 0 400 150" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M 20 80 C 100 -20, 200 180, 380 40" 
            stroke="#E8593C" 
            strokeWidth="12" 
            strokeLinecap="round" 
            className="animate-draw-line drop-shadow-[0_0_15px_rgba(232,89,60,0.7)]" 
          />
          <path 
            d="M 40 100 C 120 0, 220 200, 400 60" 
            stroke="#fff" 
            strokeWidth="4" 
            strokeLinecap="round" 
            className="animate-draw-line"
            style={{ animationDelay: '0.6s' }} 
          />
        </svg>

        {/* Mobile Animated Line Accent (Vertical Weave) */}
        <svg 
          className="block sm:hidden absolute left-1/2 top-1/2 z-0 h-[60vh] w-[80vw] -translate-x-1/2 -translate-y-1/2 transform opacity-90" 
          viewBox="0 0 200 400" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M 20 50 C 180 150, 20 280, 180 380" 
            stroke="#E8593C" 
            strokeWidth="8" 
            strokeLinecap="round" 
            className="animate-draw-line drop-shadow-[0_0_15px_rgba(232,89,60,0.7)]" 
          />
          <path 
            d="M 40 70 C 200 170, 40 300, 200 400" 
            stroke="#fff" 
            strokeWidth="3" 
            strokeLinecap="round" 
            className="animate-draw-line"
            style={{ animationDelay: '0.6s' }} 
          />
        </svg>

        {/* Left/Top: "WEAR" */}
        <div className="hero-text-reveal hero-text-reveal--1 relative z-10 flex origin-top-left -rotate-6 select-none flex-col self-start sm:origin-center sm:self-auto">
          <span className="hero-glitch group-hover:hero-glitch-hover transition-transform duration-500 group-hover:scale-[1.03] text-3d-white font-headline block text-[clamp(110px,25vw,260px)] font-black uppercase leading-[0.82] tracking-[-0.06em] text-[#F5F0E8]">
            Wear
          </span>
        </div>

        {/* Right/Bottom: "WHAT YOU MEAN" stacked */}
        <div className="hero-text-reveal hero-text-reveal--2 relative z-10 flex origin-bottom-right rotate-2 select-none flex-col items-end text-right self-end sm:origin-center sm:self-auto">
          <span className="text-3d-primary font-headline block text-[clamp(44px,11vw,90px)] font-black uppercase leading-[0.88] tracking-[-0.04em] text-primary">
            What
          </span>
          <span className="text-3d-primary font-headline block text-[clamp(52px,13vw,120px)] font-black uppercase leading-[0.88] tracking-[-0.04em] text-primary">
            You
          </span>
          <span className="text-3d-primary font-headline block text-[clamp(60px,15vw,150px)] font-black uppercase leading-[0.88] tracking-[-0.04em] text-primary">
            Mean
          </span>
        </div>
      </div>

      {/* Bottom content overlay */}
      <div className="relative z-30 mx-auto w-full max-w-7xl px-[max(1rem,env(safe-area-inset-left,0px))] pb-[max(5rem,calc(env(safe-area-inset-bottom,0px)+3rem))] pr-[max(1rem,env(safe-area-inset-right,0px))] pt-24 sm:px-6 md:px-8 lg:px-10 sm:pb-[max(2rem,calc(env(safe-area-inset-bottom,0px)+1.25rem))]">
        {/* Subtext + CTA */}
        <div className="flex flex-col items-center gap-5 text-center md:items-start md:text-left">
          <p className="hero-overlay-sub font-body max-w-md text-[15px] leading-relaxed text-stone sm:text-[17px]">
            Find the design that says it for you.
          </p>
          <Link
            to="/vibes"
            className="pointer-events-auto home-hover-lift touch-manipulation font-label inline-flex min-h-12 w-full max-w-sm items-center justify-center rounded-sm bg-primary px-8 py-5 text-sm font-medium uppercase tracking-[0.2em] text-obsidian shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:brightness-95 active:brightness-95 sm:inline-block sm:w-auto sm:px-12"
          >
            Shop by Vibe
          </Link>
          <p className="hero-overlay-ribbon font-label mt-2 max-w-xl text-[11px] font-medium uppercase leading-relaxed tracking-[0.18em] text-white/70 md:text-[12px] md:tracking-[0.22em]">
            Starting at {formatEgp(799)}
            <span className="mx-2 text-white/30" aria-hidden>|</span>
            COD Available
            <span className="mx-2 text-white/30" aria-hidden>|</span>
            Free Exchange
          </p>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="hero-scroll-pulse pointer-events-none absolute bottom-6 left-1/2 z-40 flex -translate-x-1/2 flex-col items-center gap-2 md:bottom-8">
        <span className="font-label text-[10px] font-medium uppercase tracking-[0.3em] text-white/40">
          {vibes.length} vibes · explore
        </span>
        <span className="inline-block h-5 w-px bg-gradient-to-b from-primary/60 to-transparent" aria-hidden />
      </div>
    </header>
  );
}
