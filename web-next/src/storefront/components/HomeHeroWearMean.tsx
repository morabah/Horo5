'use client';

import { useState, useMemo } from 'react';

import { trackCloserLookClick, trackHeroCtaClick } from '../analytics/events';

import { HomeHeroCinematic, HERO_BOTTOM_SENTINEL_ID } from './home/HomeHeroCinematic';
import { HomeHeroCarousel, type HeroCarouselSlide } from './home/HomeHeroCarousel';
import { HomeImageCampaign } from './home/HomeImageCampaign';
import { PAGE_HEROES } from '../content/page-heroes';
import { isImageOverlayPresentation, parseHomepagePresentation } from '../lib/parseHomepagePresentation';
import {
  pickLocalizedStorefrontText,
  type StorefrontHomepageSection,
} from '../data/catalog-types';
import {  useUiLocale, useDictionary  } from '../i18n/ui-locale';
import { normalizeLegacyStorefrontLabel } from '../utils/legacyStorefrontCopy';

const HERO_NAV_OFFSET =
  'pt-[max(var(--horo-chrome-top,3.6rem),calc(env(safe-area-inset-top,0px)+var(--horo-chrome-top,3.6rem)))]';

type HeroPayloadCta = {
  label?: { en?: string; ar?: string } | string;
  href?: string;
};

type HeroPayloadVariant = {
  key?: string;
  title?: { en?: string; ar?: string } | string;
  headline?: { en?: string; ar?: string } | string;
  body?: { en?: string; ar?: string } | string;
  subtitle?: { en?: string; ar?: string } | string;
  imageSrc?: string;
  image_src?: string;
  primaryCta?: HeroPayloadCta;
  secondaryCta?: HeroPayloadCta;
  tertiaryCta?: HeroPayloadCta;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function asHeroPayloadCta(value: unknown): HeroPayloadCta | null {
  if (!isRecord(value)) return null;
  const label = typeof value.label === 'string' || isRecord(value.label) ? value.label : undefined;
  const href = typeof value.href === 'string' ? value.href : undefined;
  return label || href ? { label, href } : null;
}

function localizedPayloadText(
  value: HeroPayloadVariant['title'] | undefined,
  locale: 'en' | 'ar',
): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || undefined;
  }
  const localized = value[locale]?.trim() || value.en?.trim() || value.ar?.trim();
  return localized || undefined;
}

function payloadString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function selectHeroVariant(payload: Record<string, unknown> | null): {
  key: string;
  variant: HeroPayloadVariant | null;
} {
  const selectedKey =
    payloadString(payload?.selectedVariant) ||
    payloadString(payload?.variant) ||
    'default';
  const variants = Array.isArray(payload?.heroVariants) ? payload.heroVariants : [];
  const variant =
    variants
      .filter(isRecord)
      .map((entry) => entry as HeroPayloadVariant)
      .find((entry) => (entry.key || 'default') === selectedKey) ?? null;
  return { key: selectedKey, variant };
}

function safeTestId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'default';
}

function isLegacyHeroBody(value: string | undefined): boolean {
  return Boolean(value && /\bCODs?\b/i.test(value));
}

function heroPromiseWithoutRhythm(value: string) {
  return value
    .replace(/\s*Find your rhythm\.?\s*$/i, '')
    .replace(/\s*Find Your Rhythm\.?\s*$/i, '')
    .trim();
}

function isLegacyDefaultHeroImage(src: string | undefined) {
  const value = src?.trim();
  return !value || value.endsWith('/images/heroes/home-hero.png');
}

export function HomeHeroWearMean({ section }: { section?: StorefrontHomepageSection }) {
  const { locale } = useUiLocale();
  const copy = useDictionary();
  const isArabic = locale === 'ar';
  const config = PAGE_HEROES.home;
  const t = (v: { en: string; ar: string } | undefined) =>
    v ? v[locale as 'en' | 'ar'] : undefined;
  const fromSection = (value: Parameters<typeof pickLocalizedStorefrontText>[0]) =>
    pickLocalizedStorefrontText(value, locale as 'en' | 'ar');
  const sectionPayload = isRecord(section?.payload) ? section.payload : null;
  const { key: heroVariant, variant: payloadVariant } = selectHeroVariant(sectionPayload);
  const ctaFromVariant = (key: 'primaryCta' | 'secondaryCta' | 'tertiaryCta') =>
    asHeroPayloadCta(payloadVariant?.[key] ?? sectionPayload?.[key]);

  const sectionBody = fromSection(section?.body);
  const subtitleBase = isLegacyHeroBody(sectionBody) ? t(config.subtitle) : sectionBody ?? t(config.subtitle);
  const primaryPayloadCta = ctaFromVariant('primaryCta');
  const secondaryPayloadCta = ctaFromVariant('secondaryCta');
  const title =
    localizedPayloadText(payloadVariant?.title ?? payloadVariant?.headline, locale as 'en' | 'ar') ??
    fromSection(section?.title) ??
    t(config.title) ??
    'Wear What You Feel';
  const promiseLine = heroPromiseWithoutRhythm(
    localizedPayloadText(payloadVariant?.body ?? payloadVariant?.subtitle, locale as 'en' | 'ar') ??
      subtitleBase ??
      copy.home.heroPromiseLine,
  );
  const rawPrimaryCtaLabel =
    localizedPayloadText(primaryPayloadCta?.label, locale as 'en' | 'ar') ??
    fromSection(section?.primaryCta?.label) ??
    t(config.primaryCta?.label) ??
    copy.home.heroPrimaryCta;
  const primaryCtaLabel = normalizeLegacyStorefrontLabel(rawPrimaryCtaLabel, locale as 'en' | 'ar') ?? rawPrimaryCtaLabel;
  const primaryHref = primaryPayloadCta?.href ?? section?.primaryCta?.href ?? config.primaryCta?.href ?? '/products';
  const rawSecondaryCtaLabel =
    localizedPayloadText(secondaryPayloadCta?.label, locale as 'en' | 'ar') ??
    fromSection(section?.secondaryCta?.label) ??
    t(config.secondaryCta?.label) ??
    copy.home.heroSecondaryCta;
  const secondaryCtaLabel = normalizeLegacyStorefrontLabel(rawSecondaryCtaLabel, locale as 'en' | 'ar') ?? rawSecondaryCtaLabel;
  const configuredSecondaryHref = secondaryPayloadCta?.href ?? section?.secondaryCta?.href ?? config.secondaryCta?.href ?? '/#shop-by-meaning';
  const secondaryHref = configuredSecondaryHref;
  const configuredHeroImageSrc = config.desktopImage?.src ?? '/images/homepage-reference/hero-right.png';
  const sectionHeroImageSrc = section?.image?.src?.trim();
  const heroImageSrc = isLegacyDefaultHeroImage(sectionHeroImageSrc)
    ? configuredHeroImageSrc
    : (sectionHeroImageSrc ?? configuredHeroImageSrc);
  const heroImageAlt =
    fromSection(section?.image?.alt) ??
    t(config.desktopImage?.alt) ??
    'Model wearing HORO graphic tee — Wear What You Feel';

  const heroPresentation = parseHomepagePresentation(sectionPayload);
  const [overlayImageFailed, setOverlayImageFailed] = useState(false);
  const isOverlayLayout =
    isImageOverlayPresentation(sectionPayload) && !overlayImageFailed;
  const carouselMode = sectionPayload?.carouselMode === true;
  const carouselSlides = useMemo((): HeroCarouselSlide[] => {
    if (!carouselMode || !sectionPayload) return [];
    const variants = Array.isArray(sectionPayload.heroVariants)
      ? sectionPayload.heroVariants.filter(isRecord).map((entry) => entry as HeroPayloadVariant)
      : [];
    if (variants.length <= 1) return [];

    return variants
      .map((entry) => {
        const slideTitle =
          localizedPayloadText(entry.title ?? entry.headline, locale as 'en' | 'ar') ?? title;
        const slideBody = heroPromiseWithoutRhythm(
          localizedPayloadText(entry.body ?? entry.subtitle, locale as 'en' | 'ar') ?? promiseLine,
        );
        const slidePrimary = asHeroPayloadCta(entry.primaryCta);
        const slideSecondary = asHeroPayloadCta(entry.secondaryCta);
        const slidePrimaryLabel =
          normalizeLegacyStorefrontLabel(
            localizedPayloadText(slidePrimary?.label, locale as 'en' | 'ar') ?? primaryCtaLabel,
            locale as 'en' | 'ar',
          ) ?? primaryCtaLabel;
        const slideSecondaryLabel =
          normalizeLegacyStorefrontLabel(
            localizedPayloadText(slideSecondary?.label, locale as 'en' | 'ar') ?? secondaryCtaLabel,
            locale as 'en' | 'ar',
          ) ?? secondaryCtaLabel;
        const variantImage =
          payloadString(entry.imageSrc) ??
          payloadString(entry.image_src) ??
          heroImageSrc;

        return {
          key: entry.key || slideTitle,
          title: slideTitle,
          body: slideBody,
          imageSrc: variantImage,
          imageAlt: heroImageAlt,
          primaryCta: {
            label: slidePrimaryLabel,
            href: slidePrimary?.href ?? primaryHref,
          },
          secondaryCta:
            heroPresentation.showSecondaryCta === true && slideSecondaryLabel
              ? {
                  label: slideSecondaryLabel,
                  href: slideSecondary?.href ?? secondaryHref,
                }
              : undefined,
          presentation: heroPresentation,
        };
      })
      .filter((slide) => slide.title && slide.imageSrc);
  }, [
    carouselMode,
    heroImageAlt,
    heroImageSrc,
    heroPresentation,
    locale,
    primaryCtaLabel,
    primaryHref,
    promiseLine,
    secondaryCtaLabel,
    secondaryHref,
    sectionPayload,
    title,
  ]);

  if (isOverlayLayout && carouselSlides.length > 1) {
    const fullBleed = heroPresentation.fullBleed !== false;
    return (
      <section
        id="home-hero"
        aria-labelledby="home-hero-heading"
        data-test-id={`home-hero-${safeTestId(heroVariant)}`}
        data-hero-variant={heroVariant}
        data-hero-layout="carousel"
        className={`${fullBleed ? 'home-hero--full-bleed' : 'px-4 sm:px-6 lg:px-8'} ${HERO_NAV_OFFSET}`}
      >
        <div className={fullBleed ? 'w-full' : 'mx-auto max-w-[1400px] pt-4'}>
          <HomeHeroCarousel slides={carouselSlides} />
        </div>
        <div id={HERO_BOTTOM_SENTINEL_ID} aria-hidden="true" className="h-px w-full" />
      </section>
    );
  }

  if (isOverlayLayout) {
    const fullBleed = heroPresentation.fullBleed !== false;
    const showSecondaryCta = heroPresentation.showSecondaryCta === true;
    return (
      <section
        id="home-hero"
        aria-labelledby="home-hero-heading"
        data-test-id={`home-hero-${safeTestId(heroVariant)}`}
        data-hero-variant={heroVariant}
        data-hero-layout="image_overlay"
        className={`${fullBleed ? 'home-hero--full-bleed' : 'px-4 sm:px-6 lg:px-8'} ${HERO_NAV_OFFSET}`}
      >
        <div className={fullBleed ? 'w-full' : 'mx-auto max-w-[1400px] pt-4'}>
          <HomeImageCampaign
            id="home-hero-campaign"
            titleAs="h1"
            titleId="home-hero-heading"
            title={title}
            body={promiseLine}
            imageSrc={heroImageSrc}
            imageAlt={isArabic ? (t(config.desktopImage?.alt) ?? 'هورو — ارتدِ ما تشعر به') : heroImageAlt}
            primaryCta={{ label: primaryCtaLabel, href: primaryHref }}
            secondaryCta={showSecondaryCta ? { label: secondaryCtaLabel, href: secondaryHref } : undefined}
            presentation={{
              ...heroPresentation,
              layout: 'image_overlay',
              showEyebrow: false,
              overlayOpacity: heroPresentation.overlayOpacity ?? 0.5,
            }}
            sectionClassName={fullBleed ? 'home-hero__campaign--full-bleed' : ''}
            priority
            minHeight="min-h-[min(72vh,52rem)]"
            onPrimaryClick={() => trackHeroCtaClick(primaryCtaLabel, primaryHref, heroVariant)}
            onSecondaryClick={() => {
              trackHeroCtaClick(secondaryCtaLabel, secondaryHref, heroVariant);
              if (secondaryHref.includes('editorial')) {
                trackCloserLookClick('hero', secondaryHref);
              }
            }}
            onImageError={() => setOverlayImageFailed(true)}
          />
        </div>
        <div id={HERO_BOTTOM_SENTINEL_ID} aria-hidden="true" className="h-px w-full" />
      </section>
    );
  }

  return (
    <div data-test-id={`home-hero-${safeTestId(heroVariant)}`}>
      <HomeHeroCinematic
        title={title}
        promiseLine={promiseLine}
        primaryCtaLabel={primaryCtaLabel}
        primaryHref={primaryHref}
        secondaryCtaLabel={secondaryCtaLabel}
        secondaryHref={secondaryHref}
        heroVariant={heroVariant}
        scrollCueLabel={copy.home.heroScrollCue}
        posterAlt={isArabic ? (t(config.desktopImage?.alt) ?? 'هورو — ارتدِ ما تشعر به') : heroImageAlt}
      />
    </div>
  );
}
