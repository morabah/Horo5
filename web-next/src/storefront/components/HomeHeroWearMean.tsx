import { Link } from 'react-router-dom';
import { homeHeroWearFeel } from '../data/images';
import { getProducts, productHasRealImage } from '../data/site';
import { useUiLocale } from '../i18n/ui-locale';
import { formatEgp } from '../utils/formatPrice';

const HERO_NAV_OFFSET = 'pt-[max(5rem,calc(env(safe-area-inset-top,0px)+4.25rem))]';
const HERO_BOTTOM_SENTINEL_ID = 'home-hero-bottom-sentinel';

export function HomeHeroWearMean() {
  const { locale } = useUiLocale();
  const isArabic = locale === 'ar';

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
  const primaryCtaLabel = isArabic ? 'تسوّق الآن' : 'Shop now';
  const secondaryCtaLabel = isArabic ? 'تسوّق حسب الشعور' : 'Shop by feeling';

  return (
    <section
      id="home-hero"
      aria-labelledby="home-hero-heading"
      className={`home-hero-wear-feel relative isolate flex min-h-svh w-full flex-col overflow-hidden ${HERO_NAV_OFFSET}`}
    >
      <img
        src={homeHeroWearFeel.src}
        alt={isArabic ? 'هورو — ارتدِ ما تشعر به' : homeHeroWearFeel.alt}
        className="absolute inset-0 h-full w-full object-cover object-[50%_70%] md:object-[50%_50%]"
        fetchPriority="high"
        loading="eager"
        decoding="async"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(9,10,8,0.35)_0%,rgba(9,10,8,0.2)_35%,rgba(9,10,8,0.45)_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-2 h-[34%] bg-linear-to-b from-black/65 via-black/25 to-transparent md:hidden"
      />

      <h1 id="home-hero-heading" className="sr-only">
        Wear What You Feel — {promiseLine}
      </h1>

      <div className="relative z-10 flex min-h-0 flex-1 items-end justify-start px-4 pb-[max(2rem,env(safe-area-inset-bottom,0px))] sm:px-6 lg:px-10 lg:pb-14">
        <div className="pointer-events-none absolute inset-x-0 top-[max(4.1rem,calc(env(safe-area-inset-top,0px)+3.55rem))] z-20 px-4 md:hidden">
          <div className="mx-auto grid w-full max-w-[92vw] grid-cols-2 gap-3">
            <div className="text-left">
              <p className="font-headline text-[clamp(1.6rem,9vw,2.4rem)] font-semibold uppercase leading-[0.9] tracking-[-0.02em] text-[#f5f0e6] drop-shadow-[0_6px_18px_rgba(0,0,0,0.6)]">
                <span className="block">WEAR</span>
                <span className="block">YOU</span>
              </p>
            </div>
            <div className="text-right">
              <p className="font-headline text-[clamp(1.6rem,9vw,2.4rem)] font-semibold uppercase leading-[0.9] tracking-[-0.02em] text-[#f5f0e6] drop-shadow-[0_6px_18px_rgba(0,0,0,0.6)]">
                <span className="block">WHAT</span>
                <span className="block">FEEL</span>
              </p>
            </div>
          </div>
        </div>
        <div className="w-full max-w-[92vw] text-left sm:max-w-[80vw] md:max-w-[min(48ch,40vw)]">
          <p className="font-body text-[clamp(1.05rem,1.55vw,1.95rem)] leading-[1.2] text-[#f5f0e6] drop-shadow-[0_4px_18px_rgba(0,0,0,0.4)]">
            <span>{promiseLine}</span>
            {priceToken ? <span className="text-[#f5f0e6]/95"> · {priceToken}</span> : null}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              to="/products"
              className="font-body inline-flex min-h-12 items-center justify-center rounded-md bg-[#f5f0e6] px-7 py-3 text-[14px] font-semibold text-[#2a2d26] transition-colors duration-200 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5f0e6]"
            >
              {primaryCtaLabel}
            </Link>
            <Link
              to="/feelings"
              className="font-body inline-flex min-h-12 items-center justify-center rounded-md border border-[#f5f0e6]/40 bg-black/20 px-7 py-3 text-[14px] font-semibold text-[#f5f0e6] transition-colors duration-200 hover:border-[#f5f0e6]/75 hover:bg-black/28 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5f0e6]"
            >
              {secondaryCtaLabel}
            </Link>
          </div>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-5 h-[22%] bg-linear-to-t from-black/50 to-transparent"
      />

      <div
        id={HERO_BOTTOM_SENTINEL_ID}
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
      />
    </section>
  );
}
