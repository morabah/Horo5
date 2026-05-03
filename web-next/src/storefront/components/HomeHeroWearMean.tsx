import Link from 'next/link';
import Image from 'next/image';

import { PAGE_HEROES } from '../content/page-heroes';
import {
  pickLocalizedStorefrontText,
  type StorefrontHomepageSection,
} from '../data/catalog-types';
import { getProducts, productHasRealImage } from '../data/site';
import {  useUiLocale, useDictionary  } from '../i18n/ui-locale';
import { formatEgp } from '../utils/formatPrice';

/** Tiny dark blur placeholder matching the hero's muted aesthetic. */
const HERO_BLUR_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAFklEQVR4nGMQERP6TwxmGFUoQtfgAQAHCnsNFNbySQAAAABJRU5ErkJggg==';

const HERO_NAV_OFFSET = 'pt-[max(5rem,calc(env(safe-area-inset-top,0px)+4.25rem))]';
const HERO_BOTTOM_SENTINEL_ID = 'home-hero-bottom-sentinel';

export function HomeHeroWearMean({ section }: { section?: StorefrontHomepageSection }) {
  const { locale } = useUiLocale();
  const copy = useDictionary();
  const isArabic = locale === 'ar';
  const config = PAGE_HEROES.home;
  const t = (v: { en: string; ar: string } | undefined) =>
    v ? v[locale as 'en' | 'ar'] : undefined;
  const fromSection = (value: Parameters<typeof pickLocalizedStorefrontText>[0]) =>
    pickLocalizedStorefrontText(value, locale as 'en' | 'ar');

  const priceRange = (() => {
    // Match the same "featured" merchandising slice users see first on home.
    const products = getProducts().filter(productHasRealImage).slice(0, 8);
    if (products.length === 0) return null;
    return Math.min(...products.map((p) => p.priceEgp));
  })();

  const subtitleBase = fromSection(section?.body) ?? t(config.subtitle);
  const priceToken = priceRange
    ? isArabic
      ? `من ${formatEgp(priceRange)}`
      : `From ${formatEgp(priceRange)}`
    : null;
  const title = fromSection(section?.title) ?? t(config.title) ?? 'Wear What You Feel';
  const promiseLine = subtitleBase ?? copy.home.heroPromiseLine;
  const primaryCtaLabel = fromSection(section?.primaryCta?.label) ?? t(config.primaryCta?.label) ?? copy.home.heroPrimaryCta;
  const primaryHref = section?.primaryCta?.href ?? config.primaryCta?.href ?? '/products';
  const secondaryCtaLabel = fromSection(section?.secondaryCta?.label) ?? t(config.secondaryCta?.label) ?? copy.home.heroSecondaryCta;
  const secondaryHref = section?.secondaryCta?.href ?? config.secondaryCta?.href ?? '/feelings';
  const heroImageSrc = section?.image?.src ?? config.desktopImage?.src ?? '/images/heroes/home-hero.png';
  const heroImageAlt =
    fromSection(section?.image?.alt) ??
    t(config.desktopImage?.alt) ??
    'Model wearing HORO graphic tee — Wear What You Feel';

  return (
    <section
      id="home-hero"
      aria-labelledby="home-hero-heading"
      className={`home-hero-wear-feel relative isolate flex min-h-svh w-full flex-col overflow-hidden ${HERO_NAV_OFFSET}`}
    >
      <Image
        src={heroImageSrc}
        alt={isArabic ? (t(config.desktopImage?.alt) ?? 'هورو — ارتدِ ما تشعر به') : heroImageAlt}
        fill
        sizes="100vw"
        priority
        placeholder="blur"
        blurDataURL={HERO_BLUR_DATA_URL}
        className="absolute inset-0 h-full w-full object-cover object-[50%_70%] md:object-[50%_50%]"
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
        {title} — {promiseLine}
      </h1>

      <div className="relative z-10 flex min-h-0 flex-1 items-end justify-start px-4 pb-[max(2rem,env(safe-area-inset-bottom,0px))] sm:px-6 lg:px-10 lg:pb-14">
        {config.titleLayout === 'mantra-grid' ? (
          <div className="pointer-events-none absolute inset-x-0 top-[max(4.1rem,calc(env(safe-area-inset-top,0px)+3.55rem))] z-20 px-4 md:hidden">
            <div className="mx-auto w-full max-w-[92vw]">
              <p className="grid grid-cols-2 gap-x-16 gap-y-1 font-headline text-[clamp(1.75rem,9.5vw,2.8rem)] font-semibold uppercase leading-[0.88] tracking-tight text-[#f5f0e6] drop-shadow-[0_6px_18px_rgba(0,0,0,0.6)]">
                <span className="block text-left">WEAR</span>
                <span className="block text-right">WHAT</span>
                <span className="block text-left">YOU</span>
                <span className="block text-right">FEEL</span>
              </p>
            </div>
          </div>
        ) : null}
        <div className="w-full max-w-[92vw] text-left sm:max-w-[80vw] md:max-w-[min(48ch,40vw)]">
          <p className="font-body text-[clamp(1.12rem,1.7vw,2.05rem)] font-medium leading-[1.18] text-[#f5f0e6] drop-shadow-[0_4px_18px_rgba(0,0,0,0.4)]">
            <span>{promiseLine}</span>
            {priceToken ? <span className="text-[0.86em] font-medium text-[#f5f0e6]/88"> · {priceToken}</span> : null}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              href={primaryHref}
              className="font-body inline-flex min-h-14 items-center justify-center rounded-md bg-[#f5f0e6] px-7 py-3 text-[14px] font-semibold text-[#2a2d26] transition-colors duration-200 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5f0e6]"
            >
              {primaryCtaLabel}
            </Link>
            <Link
              href={secondaryHref}
              className="font-body inline-flex min-h-11 items-center text-[14px] font-medium text-[#f5f0e6]/85 underline decoration-[#f5f0e6]/40 underline-offset-4 transition-colors duration-200 hover:text-[#f5f0e6] hover:decoration-[#f5f0e6]/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5f0e6]"
            >
              {secondaryCtaLabel}
              <span aria-hidden className="ml-1.5">→</span>
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
