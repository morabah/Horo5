import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

import { trackCloserLookClick, trackHeroCtaClick } from '../analytics/events';

import { HomeImageCampaign } from './home/HomeImageCampaign';
import { PAGE_HEROES } from '../content/page-heroes';
import { isImageOverlayPresentation, parseHomepagePresentation } from '../lib/parseHomepagePresentation';
import {
  pickLocalizedStorefrontText,
  type StorefrontHomepageSection,
} from '../data/catalog-types';
import {  useUiLocale, useDictionary  } from '../i18n/ui-locale';
import { normalizeLegacyStorefrontLabel } from '../utils/legacyStorefrontCopy';

/** Tiny dark blur placeholder matching the hero's muted aesthetic. */
const HERO_BLUR_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAFklEQVR4nGMQERP6TwxmGFUoQtfgAQAHCnsNFNbySQAAAABJRU5ErkJggg==';

const HERO_NAV_OFFSET = 'pt-[max(3.6rem,calc(env(safe-area-inset-top,0px)+3.6rem))]';
const HERO_BOTTOM_SENTINEL_ID = 'home-hero-bottom-sentinel';

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

/** Split “Wear What You Feel” across two lines like the homepage mockup. */
function HeroTitleDisplay({ title }: { title: string }) {
  const normalized = title.replace(/\s+/g, ' ').trim();
  const match = normalized.match(/^(wear what)\s+(you feels?)$/i);
  if (match) {
    return (
      <>
        <span className="block">Wear What </span>
        <span className="block">You Feel</span>
      </>
    );
  }
  return normalized;
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

  if (isOverlayLayout) {
    return (
      <section
        id="home-hero"
        aria-labelledby="home-hero-heading"
        data-test-id={`home-hero-${safeTestId(heroVariant)}`}
        data-hero-variant={heroVariant}
        data-hero-layout="image_overlay"
        className={`px-4 sm:px-6 lg:px-8 ${HERO_NAV_OFFSET}`}
      >
        <div className="mx-auto max-w-[1400px] pt-4">
          <HomeImageCampaign
            id="home-hero-campaign"
            titleAs="h1"
            titleId="home-hero-heading"
            title={title}
            body={promiseLine}
            imageSrc={heroImageSrc}
            imageAlt={isArabic ? (t(config.desktopImage?.alt) ?? 'هورو — ارتدِ ما تشعر به') : heroImageAlt}
            primaryCta={{ label: primaryCtaLabel, href: primaryHref }}
            secondaryCta={{ label: secondaryCtaLabel, href: secondaryHref }}
            presentation={{
              ...heroPresentation,
              layout: 'image_overlay',
              showEyebrow: false,
              overlayOpacity: heroPresentation.overlayOpacity ?? 0.5,
            }}
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
    <section
      id="home-hero"
      aria-labelledby="home-hero-heading"
      data-test-id={`home-hero-${safeTestId(heroVariant)}`}
      data-hero-variant={heroVariant}
      data-hero-layout="split"
      className={`home-hero-split ${HERO_NAV_OFFSET}`}
    >
      <div className="mx-auto flex max-w-[1400px] flex-col lg:grid lg:grid-cols-2 lg:items-stretch">
        <div className="home-hero-split__copy order-1 max-lg:px-4 max-lg:pt-4 max-lg:pb-3">
          <h1 id="home-hero-heading" className="home-hero-split__title">
            <HeroTitleDisplay title={title} />
          </h1>
          <p className="home-hero-split__subtitle mt-4 max-w-[560px] max-lg:mt-3 max-lg:text-[15px] lg:mt-5">
            {promiseLine}
          </p>
          <div className="home-hero-split__actions mt-6 flex flex-wrap gap-3 max-lg:mt-4">
            <Link
              href={primaryHref}
              onClick={() => trackHeroCtaClick(primaryCtaLabel, primaryHref, heroVariant)}
              className="home-btn home-btn--primary font-body inline-flex min-h-[42px] items-center justify-center rounded-[4px] bg-horo-pulse px-5 py-2 text-[12px] font-bold text-white transition-[transform,background-color] hover:bg-horo-root focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-horo-pulse"
            >
              {primaryCtaLabel}
            </Link>
            <Link
              href={secondaryHref}
              onClick={() => {
                trackHeroCtaClick(secondaryCtaLabel, secondaryHref, heroVariant);
                if (secondaryHref.includes('editorial')) {
                  trackCloserLookClick('hero', secondaryHref);
                }
              }}
              className="home-btn home-btn--secondary font-body inline-flex min-h-[42px] items-center justify-center rounded-[4px] border border-horo-pulse bg-transparent px-5 py-2 text-[12px] font-bold text-horo-root transition-[transform,background-color,color] hover:bg-horo-root hover:text-horo-breath focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-horo-pulse"
            >
              {secondaryCtaLabel}
            </Link>
          </div>
        </div>

        <div className="home-hero-split__media order-2">
          <Image
            src={heroImageSrc}
            alt={isArabic ? (t(config.desktopImage?.alt) ?? 'هورو — ارتدِ ما تشعر به') : heroImageAlt}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
            placeholder="blur"
            blurDataURL={HERO_BLUR_DATA_URL}
            className="h-full w-full object-cover object-[50%_38%]"
          />
        </div>
      </div>

      <div id={HERO_BOTTOM_SENTINEL_ID} aria-hidden="true" className="h-px w-full" />
    </section>
  );
}
