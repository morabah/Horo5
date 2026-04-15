import { Link } from 'react-router-dom';
import { BRAND_COPY } from '../data/brand';
import { STOREFRONT_IMAGE_SLOTS } from '../data/images';
import { getProducts, productHasRealImage } from '../data/site';
import { useUiLocale } from '../i18n/ui-locale';
import { formatEgp } from '../utils/formatPrice';

const HERO_NAV_OFFSET =
  'pt-[max(5rem,calc(env(safe-area-inset-top,0px)+4.25rem))]';
const HERO_BOTTOM_SENTINEL_ID = 'home-hero-bottom-sentinel';

export function HomeHeroWearMean() {
  const { locale } = useUiLocale();
  const isArabic = locale === 'ar';
  const heroVisual = STOREFRONT_IMAGE_SLOTS.home.hero;
  const isVectorHero = heroVisual.src.endsWith('.svg');

  const priceRange = (() => {
    const products = getProducts().filter(productHasRealImage);
    if (products.length === 0) return null;
    return Math.min(...products.map((p) => p.priceEgp));
  })();

  const promiseLine = isArabic
    ? 'تيشيرتات بطباعة فنانين محليين، مصنوعة في مصر.'
    : 'Graphic tees by local artists — printed in Egypt.';
  const priceToken = priceRange
    ? isArabic
      ? `من ${formatEgp(priceRange)}`
      : `From ${formatEgp(priceRange)}`
    : null;
  const primaryCtaLabel = isArabic ? 'تسوّق الأكثر مبيعاً' : 'Shop bestsellers';
  const secondaryCtaLabel = isArabic ? 'تسوّق حسب الشعور' : 'Shop by feeling';

  const mantraTokens = BRAND_COPY.mantra.trim().split(/\s+/);
  const splitIndex = Math.ceil(mantraTokens.length / 2);
  const topWords = mantraTokens.slice(0, splitIndex);
  const bottomWords = mantraTokens.slice(splitIndex);

  const renderTypographyRow = (words: string[], key: string) => (
    <div
      key={key}
      aria-hidden="true"
      className="pointer-events-none relative flex w-full items-baseline justify-between gap-[2vw] px-1 font-headline font-medium uppercase leading-[0.82] tracking-[-0.04em] text-papyrus sm:px-3"
    >
      {words.map((word, idx) => (
        <span
          key={`${key}-${idx}`}
          className="inline-block text-[clamp(2.75rem,16vw,11rem)] drop-shadow-[0_6px_28px_rgba(0,0,0,0.35)]"
          style={{
            letterSpacing: '-0.04em',
            WebkitTextStroke: '0.5px rgba(255,245,230,0.08)',
          }}
        >
          {word}
        </span>
      ))}
    </div>
  );

  return (
    <section
      id="home-hero"
      aria-labelledby="home-hero-heading"
      className={`relative isolate flex min-h-[min(72svh,44rem)] w-full flex-col overflow-hidden bg-obsidian md:min-h-[min(92svh,56rem)] ${HERO_NAV_OFFSET}`}
    >
      {/* Warm radial ambience — centered behind the model */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 58%, rgba(196,140,96,0.38) 0%, rgba(120,80,52,0.28) 22%, rgba(46,34,26,0.7) 52%, rgba(14,12,10,0.97) 78%, #080706 100%)',
        }}
      />
      {/* Edge vignette to deepen the frame */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, transparent 42%, rgba(0,0,0,0.55) 100%)',
        }}
      />
      {/* Editorial film grain */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[2] opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.78' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '220px 220px',
        }}
      />

      <h1 id="home-hero-heading" className="sr-only">
        {BRAND_COPY.mantra} — {promiseLine}
      </h1>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-between px-4 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">
        {renderTypographyRow(topWords, 'top')}

        <div className="relative -my-4 flex w-full flex-1 items-center justify-center sm:-my-6 lg:-my-10">
          <img
            src={heroVisual.src}
            alt={isArabic ? 'شعار هورو' : heroVisual.alt}
            width={isVectorHero ? 1200 : 1600}
            height={isVectorHero ? 960 : 1600}
            fetchPriority="high"
            loading="eager"
            className={`hero-editorial-zoom relative z-20 h-auto max-h-[min(58svh,600px)] w-auto max-w-full object-contain drop-shadow-[0_30px_80px_rgba(0,0,0,0.6)] lg:max-h-[min(72svh,780px)] ${isVectorHero ? 'opacity-95' : ''}`}
          />
        </div>

        {renderTypographyRow(bottomWords, 'bottom')}

        <div className="relative z-20 mt-5 flex w-full max-w-xl flex-col items-center gap-3 text-center sm:mt-6">
          <p className="font-body text-[13px] leading-relaxed text-stone md:text-sm">
            <span>{promiseLine}</span>
            {priceToken ? <span className="text-papyrus/90"> · {priceToken}</span> : null}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/products"
              className="font-body inline-flex min-h-12 items-center justify-center bg-clean-white px-7 py-3.5 text-[14px] font-semibold text-obsidian transition-colors duration-200 hover:bg-papyrus focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-river"
            >
              {primaryCtaLabel}
            </Link>
            <Link
              to="/feelings"
              className="font-body inline-flex min-h-12 items-center justify-center px-3 text-[13px] font-medium text-white/90 underline decoration-white/30 underline-offset-4 transition-colors duration-200 hover:text-white hover:decoration-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-river"
            >
              {secondaryCtaLabel}
            </Link>
          </div>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-1 h-[22%] bg-linear-to-t from-obsidian/95 to-transparent"
      />
      <div id={HERO_BOTTOM_SENTINEL_ID} aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-px" />
    </section>
  );
}
