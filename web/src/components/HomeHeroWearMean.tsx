import { Link } from 'react-router-dom';
import { BRAND_COPY } from '../data/brand';
import { heroModelHome } from '../data/images';
import { useUiLocale } from '../i18n/ui-locale';

const HERO_NAV_OFFSET =
  'pt-[max(5rem,calc(env(safe-area-inset-top,0px)+4.25rem))]';
const HERO_BOTTOM_SENTINEL_ID = 'home-hero-bottom-sentinel';

export function HomeHeroWearMean() {
  const { copy } = useUiLocale();

  return (
    <section
      id="home-hero"
      aria-labelledby="home-hero-heading"
      className={`relative isolate flex min-h-svh w-full flex-col overflow-hidden bg-obsidian ${HERO_NAV_OFFSET}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-[-14%] left-1/2 z-0 h-[48vh] w-[min(92vw,44rem)] -translate-x-1/2 rounded-full bg-papyrus/8 blur-3xl lg:bottom-[-10%] lg:right-[8%] lg:left-auto lg:h-[56vh] lg:w-[36rem] lg:translate-x-0"
      />
      {/* Editorial grain overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] opacity-[0.022] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.78' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
        }}
      />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col px-5 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] lg:flex-row lg:items-stretch lg:gap-10 lg:px-10 lg:pb-10">
        <div className="flex max-w-xl flex-col justify-center gap-5 lg:w-[min(38%,24rem)] lg:shrink-0 lg:py-6">
          <h1
            id="home-hero-heading"
            aria-describedby="home-hero-support"
            className="font-headline text-[clamp(2.5rem,7vw,4.5rem)] font-medium leading-[1.04] tracking-tight text-papyrus"
          >
            {BRAND_COPY.mantra}
          </h1>
          <p
            id="home-hero-support"
            className="max-w-md font-body text-sm leading-relaxed text-stone md:text-[15px]"
          >
            {BRAND_COPY.heroSupportLine}
          </p>
          {/* Decorative accent line */}
          <div className="h-px w-8 bg-primary/40" aria-hidden="true" />
          <div>
            <Link
              to="/feelings"
              className="font-body inline-flex min-h-11 items-center justify-center border border-white/40 bg-white/5 px-8 py-3.5 text-sm font-medium text-white transition-all duration-300 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-river"
            >
              {copy.home.heroCta}
            </Link>
          </div>
        </div>

        <div className="relative mt-2 flex min-h-[min(48vh,420px)] flex-1 items-end justify-center overflow-visible py-2 lg:mt-0 lg:min-h-[min(76vh,760px)] lg:justify-end lg:py-4">
          <img
            src={heroModelHome}
            alt="Model wearing a HORO graphic tee"
            fetchPriority="high"
            loading="eager"
            className="hero-editorial-zoom relative z-1 h-auto max-h-[min(65vh,580px)] w-full max-w-none object-contain object-bottom drop-shadow-[0_20px_60px_rgba(0,0,0,0.4)] lg:max-h-none lg:max-w-none"
          />
        </div>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-1 h-[28%] bg-linear-to-t from-obsidian/90 to-transparent"
      />
      <div id={HERO_BOTTOM_SENTINEL_ID} aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-px" />
    </section>
  );
}
