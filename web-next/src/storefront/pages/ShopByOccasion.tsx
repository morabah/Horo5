'use client';

import Link from 'next/link';
import { useEffect, useMemo } from 'react';

import { GiftCohortCards } from '../components/GiftCohortCards';
import { MerchProductCard } from '../components/MerchProductCard';
import { PageBreadcrumb } from '../components/PageBreadcrumb';
import { RecentlyViewedStrip } from '../components/RecentlyViewedStrip';
import { TeeImageFrame } from '../components/TeeImage';
import { PAGE_HEROES } from '../content/page-heroes';
import { getOccasionCollectionVisual, getProductCardImageSrc, imgUrl } from '../data/images';
import {  useUiLocale, useDictionary  } from '../i18n/ui-locale';
import {
  getFeeling,
  getOccasions,
  getProducts,
  productHasRealImage,
  setRuntimeOccasions,
  setRuntimeProducts,
  type Occasion,
  type Product,
} from '../data/site';
import { trackOccasionsHubView } from '../analytics/funnel';

function getOccasionHeroTiles(occasions: Occasion[]) {
  return occasions
    .slice(0, 6)
    .map((o) => {
      const visual = getOccasionCollectionVisual(o.slug);
      return {
        slug: o.slug,
        src: visual.hero.src || visual.proof.src || o.cardImageSrc,
        alt: visual.hero.alt || o.cardImageAlt || o.name,
        objectPosition: visual.hero.objectPosition,
      };
    })
    .filter((t) => t.src);
}

type ShopByOccasionProps = {
  /** When set (e.g. from Next RSC), replaces runtime/static getOccasions() for first paint. */
  initialOccasions?: Occasion[];
  initialProducts?: Product[];
  mode?: 'occasions' | 'gifts';
};

function SecondaryOccasionCard({ slug, name, blurb, cardImageSrc, cardImageAlt }: Occasion) {
  const copy = useDictionary();
  return (
    <Link
      href={`/occasions/${slug}`}
      className="group overflow-hidden rounded-[18px] border border-stone/70 bg-white/75 text-inherit no-underline shadow-[0_18px_44px_-28px_rgba(26,26,26,0.24)] transition-transform duration-300 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
    >
      <div className="overflow-hidden">
        <div className="transition-transform duration-500 ease-out group-hover:scale-[1.03]">
          <TeeImageFrame src={cardImageSrc} alt={cardImageAlt} w={900} aspectRatio="4/5" borderRadius="0" />
        </div>
      </div>
      <div className="space-y-3 p-4 md:p-5">
        <h2 className="font-headline text-[1.18rem] font-semibold leading-snug text-obsidian">{name}</h2>
        <p className="font-body text-[0.96rem] leading-relaxed text-warm-charcoal">{blurb}</p>
        <span className="font-label inline-flex min-h-11 items-center text-[11px] font-medium uppercase tracking-[0.2em] text-obsidian transition-colors group-hover:text-deep-teal">
          {copy.occasion.secondaryCta}
        </span>
      </div>
    </Link>
  );
}

export function ShopByOccasion({ initialOccasions, initialProducts, mode = 'occasions' }: ShopByOccasionProps = {}) {
  if (initialOccasions) setRuntimeOccasions(initialOccasions);
  if (initialProducts) setRuntimeProducts(initialProducts);

  const { locale } = useUiLocale();
  const copy = useDictionary();
  const isArabic = locale === 'ar';
  const isGiftsHub = mode === 'gifts';
  const hubLabel = isGiftsHub ? (isArabic ? 'هدايا' : 'Gifts') : copy.shell.shopByMoment;
  const hubTitle = isGiftsHub
    ? (isArabic ? 'هدايا بتحس إنها شخصية' : 'Gifts that feel personal')
    : (PAGE_HEROES.occasions.title[locale as 'en' | 'ar'] ?? copy.occasion.hubTitle);
  const hubEyebrow = isGiftsHub
    ? (isArabic ? 'تيشيرتات فنانين للناس واللحظات والمشاعر' : 'Artist-made T-shirts for people, moments, and feelings')
    : (PAGE_HEROES.occasions.eyebrow?.[locale as 'en' | 'ar'] ?? copy.occasion.hubEyebrow);
  const gridEyebrow = isGiftsHub
    ? (isArabic ? 'هدايا حسب المناسبة' : 'Gift by Occasion')
    : copy.occasion.hubGridEyebrow;
  const gridTitle = isGiftsHub
    ? (isArabic ? 'اختار اللحظة المناسبة' : 'Choose the moment')
    : copy.occasion.hubGridTitle;
  const occasions = initialOccasions !== undefined ? initialOccasions : getOccasions();
  const products = initialProducts !== undefined ? initialProducts : getProducts();
  const giftOccasionSlugs = useMemo(() => new Set(occasions.map((occasion) => occasion.slug)), [occasions]);
  const giftProducts = useMemo(() => {
    if (!isGiftsHub) return [] as Product[];
    return products
      .filter(productHasRealImage)
      .filter((product) => {
        if (product.giftable === true) return true;
        if ((product.giftOccasionTags ?? []).length > 0) return true;
        return product.occasionSlugs.some((slug) => giftOccasionSlugs.has(slug));
      })
      .slice(0, 8);
  }, [giftOccasionSlugs, isGiftsHub, products]);
  const giftFeelingSlugs = useMemo(() => {
    return [...new Set(giftProducts.map((product) => product.primaryFeelingSlug ?? product.feelingSlug).filter(Boolean))]
      .slice(0, 6);
  }, [giftProducts]);

  useEffect(() => {
    if (occasions.length > 0) trackOccasionsHubView(occasions.length);
  }, [occasions.length]);

  if (occasions.length === 0 && (!isGiftsHub || giftProducts.length === 0)) {
    return (
      <div className="bg-papyrus pb-16 md:pb-20">
        <div className="mx-auto max-w-7xl px-4 pt-8 md:px-8 md:pt-10">
          <PageBreadcrumb
            className="mb-6"
            items={[
              { label: copy.shell.home, to: '/' },
              { label: hubLabel },
            ]}
          />
          <p className="font-body text-warm-charcoal">Moment collections are not available yet. Try again shortly.</p>
          <Link className="btn btn-primary mt-6 inline-flex" href="/">
            {copy.shell.home}
          </Link>
        </div>
      </div>
    );
  }

  const occasionHeroTiles = getOccasionHeroTiles(occasions);
  const giftProductHeroTiles = isGiftsHub
    ? giftProducts.slice(0, 4).map((product) => ({
        slug: product.slug,
        src: getProductCardImageSrc(product),
        alt: `HORO ${product.name} gift-ready T-shirt.`,
        objectPosition: undefined,
      })).filter((tile) => tile.src)
    : [];
  const heroTiles = occasionHeroTiles.length > 0 ? occasionHeroTiles : giftProductHeroTiles;
  const heroTileCount = Math.max(1, heroTiles.length);

  return (
    <div className="bg-papyrus pb-16 md:pb-20">
      <div className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-7xl flex-col gap-10 px-4 pt-8 md:gap-12 md:px-8 md:pt-10">
        <PageBreadcrumb
          className="mb-0 md:-mb-2"
          items={[
            { label: copy.shell.home, to: '/' },
            { label: hubLabel },
          ]}
        />

        {/* Hero — photo grid with glass headline bar */}
        <section
          className="relative isolate overflow-hidden"
          aria-label={hubEyebrow}
        >
          <div
            className="grid min-h-[26rem] grid-cols-2 gap-0.5 bg-obsidian sm:min-h-[30rem] sm:grid-cols-3 sm:gap-1 lg:min-h-[34rem] lg:[grid-template-columns:repeat(var(--hero-tile-count),minmax(0,1fr))]"
            style={{ ['--hero-tile-count' as string]: String(heroTileCount) }}
          >
            {heroTiles.map((tile) => (
              <img
                key={tile.slug}
                src={imgUrl(tile.src, 900)}
                alt={tile.alt}
                className="h-full w-full object-cover"
                style={{ objectPosition: tile.objectPosition }}
                width={900}
                height={1200}
                decoding="async"
              />
            ))}
          </div>
          {/* Minimal vignette — photos are the hero */}
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.2)_100%)]"
            aria-hidden
          />

          {/* Bottom glass bar — headline only */}
          <div className="absolute inset-x-0 bottom-0">
            <div className="feelings-hub-glass-bar flex items-center justify-center px-4 py-5 sm:py-6">
              <h1 className="text-center font-headline text-[clamp(1.5rem,5vw,2.5rem)] font-semibold leading-tight tracking-tight text-white">
                {hubTitle}
              </h1>
            </div>
          </div>

          {/* Shop All pill — top left */}
          <div className="absolute left-4 top-4 sm:left-6 sm:top-6 md:left-8 md:top-8">
            {PAGE_HEROES.occasions.primaryCta?.href && PAGE_HEROES.occasions.primaryCta.label[locale as 'en' | 'ar'] ? (
              <Link
                href={PAGE_HEROES.occasions.primaryCta.href}
                className="feelings-hub-glass-pill font-label inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full px-4 py-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-white transition-all hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:text-[10px]"
              >
                {PAGE_HEROES.occasions.primaryCta.label[locale as 'en' | 'ar']}
                <span className="text-white/50" aria-hidden>→</span>
              </Link>
            ) : (
              <Link
                href="/products"
                className="feelings-hub-glass-pill font-label inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full px-4 py-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-white transition-all hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:text-[10px]"
              >
                {copy.shell.shopAll}
                <span className="text-white/50" aria-hidden>→</span>
              </Link>
            )}
          </div>
        </section>

        {/* Occasion cards grid */}
        <section aria-labelledby="occasion-grid-title" className="bg-papyrus pb-16 md:pb-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="font-label text-[10px] font-medium uppercase tracking-[0.22em] text-label">{gridEyebrow}</p>
                <h2
                  id="occasion-grid-title"
                  className="font-headline mt-2 text-[1.35rem] font-semibold tracking-tight text-obsidian md:text-[1.6rem]"
                >
                  {gridTitle}
                </h2>
              </div>
              <Link
                href="/feelings"
                className="font-label inline-flex min-h-11 items-center text-[11px] font-semibold uppercase tracking-[0.18em] text-deep-teal transition-colors hover:text-obsidian"
              >
                {copy.shell.shopByFeeling}
              </Link>
            </div>
            <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-7">
              {occasions.map((occasion) => (
                <SecondaryOccasionCard key={occasion.slug} {...occasion} />
              ))}
            </div>
          </div>
        </section>

        {isGiftsHub ? (
          <section aria-labelledby="gift-feeling-title" className="bg-papyrus pb-16 md:pb-20">
            <div className="mx-auto max-w-7xl">
              <p className="font-label text-[10px] font-medium uppercase tracking-[0.22em] text-label">
                {isArabic ? 'هدايا حسب الإحساس' : 'Gift by Feeling'}
              </p>
              <h2 id="gift-feeling-title" className="font-headline mt-2 text-[1.35rem] font-semibold tracking-tight text-obsidian md:text-[1.6rem]">
                {isArabic ? 'ابدأ من الإحساس اللي عايز توصله' : 'Start with the feeling you want to send'}
              </h2>
              <div className="mt-5 flex flex-wrap gap-3">
                {giftFeelingSlugs.map((slug) => {
                  const feeling = getFeeling(slug);
                  return (
                    <Link
                      key={slug}
                      href={`/feelings/${slug}`}
                      className="font-label inline-flex min-h-11 items-center rounded-full border border-stone/60 bg-white/80 px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-obsidian transition-colors hover:border-obsidian"
                    >
                      {feeling?.name ?? slug}
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        ) : null}

        {isGiftsHub && giftProducts.length > 0 ? (
          <section aria-labelledby="gift-products-title" className="bg-papyrus pb-16 md:pb-20">
            <div className="mx-auto max-w-7xl">
              <div className="mb-8">
                <p className="font-label text-[10px] font-medium uppercase tracking-[0.22em] text-label">
                  {isArabic ? 'قطع جاهزة للهدايا' : 'Gift-ready products'}
                </p>
                <h2 id="gift-products-title" className="font-headline mt-2 text-[1.35rem] font-semibold tracking-tight text-obsidian md:text-[1.6rem]">
                  {isArabic ? 'تيشيرتات بفكرة واضحة للهدية' : 'Pieces with a clear gift reason'}
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {giftProducts.map((product) => (
                  <MerchProductCard
                    key={product.slug}
                    slug={product.slug}
                    name={product.name}
                    compareAtPriceEgp={product.originalPriceEgp ?? undefined}
                    priceEgp={product.priceEgp}
                    imageSrc={getProductCardImageSrc(product)}
                    imageAlt={`HORO ${product.name} gift-ready T-shirt.`}
                    promoLabel={product.promoLabel}
                    promoEndsAt={product.promoEndsAt}
                    promoShowCountdown={product.promoShowCountdown}
                    eyebrow={product.feelsLike?.[0] || product.worksFor?.[0]}
                    artistCredit={product.artistDisplay?.name ? `Illustrated by ${product.artistDisplay.name}` : undefined}
                    onQuickView={() => undefined}
                  />
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {isGiftsHub ? (
          <section aria-label={isArabic ? 'مساعدة الهدية' : 'Gift help'} className="grid gap-4 border-y border-stone/25 py-8 md:grid-cols-2">
            <div className="rounded-2xl border border-stone/30 bg-white/65 p-6">
              <h2 className="font-headline text-lg font-semibold text-obsidian">
                {isArabic ? 'مساعدة في المقاس على واتساب' : 'Size help through WhatsApp'}
              </h2>
              <p className="mt-3 font-body text-sm leading-relaxed text-warm-charcoal">
                {isArabic
                  ? 'لو الهدية لشخص تاني، اسألنا قبل الطلب ونساعدك تختار المقاس الأقرب.'
                  : 'If the gift is for someone else, ask us before ordering and we will help pick the safest size.'}
              </p>
            </div>
            <div className="rounded-2xl border border-stone/30 bg-white/65 p-6">
              <h2 className="font-headline text-lg font-semibold text-obsidian">
                {isArabic ? 'توصيل واستبدال واضح' : 'Delivery and exchange reassurance'}
              </h2>
              <p className="mt-3 font-body text-sm leading-relaxed text-warm-charcoal">
                {isArabic
                  ? 'الدفع عند الاستلام متاح حيث ينطبق، والاستبدال خلال 14 يوم حسب سياسة الاستبدال.'
                  : 'COD is available where eligible, and exchange is supported for 14 days under the exchange policy.'}
              </p>
            </div>
          </section>
        ) : null}

        {isGiftsHub && <GiftCohortCards />}
      </div>

      <RecentlyViewedStrip className="border-t border-stone/20" />
    </div>
  );
}
