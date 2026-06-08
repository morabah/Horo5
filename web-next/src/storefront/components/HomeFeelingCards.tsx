import Link from 'next/link';

import { trackMeaningTileClick } from '../analytics/events';
import { FeelingTileIcon } from './home/FeelingTileIcon';
import { HOME_FEELING_TILE_SURFACES } from '../data/homeContent';
import {
  pickLocalizedStorefrontText,
  type StorefrontHomepageSection,
} from '../data/catalog-types';
import { HOME_MEANING_TILE_IMAGES, isUnavailableHomepageReferenceImageSrc } from '../data/images';
import { getFeelings, productHasRealImage, productsByFeeling } from '../data/site';
import { parseHomepagePresentation } from '../lib/parseHomepagePresentation';
import { useUiLocale, useDictionary } from '../i18n/ui-locale';
import { normalizeLegacyStorefrontLabel } from '../utils/legacyStorefrontCopy';

type FeelingTileOverride = {
  slug: string;
  label?: string;
  subtitle?: string;
  iconSlug?: string;
  surface?: string;
  href?: string;
  imageSrc?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function localizedPayloadText(value: unknown, locale: 'en' | 'ar') {
  return pickLocalizedStorefrontText(
    typeof value === 'string' || isRecord(value) ? (value as Parameters<typeof pickLocalizedStorefrontText>[0]) : undefined,
    locale,
  );
}

function payloadFeelingOverrides(section: StorefrontHomepageSection | undefined, locale: 'en' | 'ar'): FeelingTileOverride[] {
  const payload = isRecord(section?.payload) ? section.payload : null;
  const raw =
    (Array.isArray(payload?.feelings) && payload.feelings) ||
    (Array.isArray(payload?.feelingSlugs) && payload.feelingSlugs) ||
    (Array.isArray(payload?.items) && payload.items) ||
    [];

  return raw.flatMap((item): FeelingTileOverride[] => {
    if (typeof item === 'string') {
      const slug = item.trim();
      return slug ? [{ slug }] : [];
    }
    if (!isRecord(item)) return [];
    const slugValue = item.slug ?? item.feelingSlug ?? item.key ?? item.handle;
    const slug = typeof slugValue === 'string' ? slugValue.trim() : '';
    if (!slug) return [];
    const iconValue = item.iconSlug ?? item.icon;
    const surfaceValue = item.surface ?? item.color ?? item.accent;
    const hrefValue = item.href;
    const imageSrcValue = item.imageSrc ?? item.image_src;
    return [{
      slug,
      label: localizedPayloadText(item.label ?? item.name ?? item.title, locale),
      subtitle: localizedPayloadText(item.subtitle ?? item.tagline ?? item.blurb, locale),
      iconSlug: typeof iconValue === 'string' ? iconValue : undefined,
      surface: typeof surfaceValue === 'string' ? surfaceValue : undefined,
      href: typeof hrefValue === 'string' ? hrefValue : undefined,
      imageSrc:
        typeof imageSrcValue === 'string' && imageSrcValue.trim() ? imageSrcValue.trim() : undefined,
    }];
  });
}

function getFeaturedFeelings(section: StorefrontHomepageSection | undefined, locale: 'en' | 'ar') {
  const allEntries = getFeelings()
    .filter((feeling) => feeling.active !== false)
    .map((feeling, index) => {
      const realProducts = productsByFeeling(feeling.slug).filter(productHasRealImage);
      return { feeling, index, count: realProducts.length, override: undefined as FeelingTileOverride | undefined };
    })
    .filter((entry) => entry.count > 0)
    .sort((a, b) => (a.feeling.sortOrder ?? a.index) - (b.feeling.sortOrder ?? b.index) || a.index - b.index);
  const bySlug = new Map(allEntries.map((entry) => [entry.feeling.slug, entry] as const));
  const overrides = payloadFeelingOverrides(section, locale);
  if (overrides.length > 0) {
    const selected = overrides
      .map((override, overrideIndex) => {
        const entry = bySlug.get(override.slug);
        if (entry) return { ...entry, override };
        return {
          feeling: {
            slug: override.slug,
            name: override.label ?? override.slug,
            active: true,
            accent: '#8C2340',
            blurb: override.subtitle ?? '',
            tagline: override.subtitle ?? '',
          },
          index: overrideIndex,
          count: 0,
          override,
        };
      })
      .filter((entry) => Boolean(entry));
    if (selected.length > 0) return selected.slice(0, 12);
  }
  return allEntries.slice(0, 5);
}

function launchMeaningTileEntries(copy: ReturnType<typeof useDictionary>): ReturnType<typeof getFeaturedFeelings> {
  const tiles: FeelingTileOverride[] = [
    {
      slug: 'mood',
      label: copy.home.meaningMoodTitle,
      subtitle: copy.home.meaningMoodSubtitle,
      href: '/products?category=mood',
      iconSlug: 'mood',
    },
    {
      slug: 'lifestyle',
      label: copy.home.meaningLifestyleTitle,
      subtitle: copy.home.meaningLifestyleSubtitle,
      href: '/products?category=lifestyle',
      iconSlug: 'lifestyle',
    },
    {
      slug: 'career',
      label: copy.home.meaningCareerTitle,
      subtitle: copy.home.meaningCareerSubtitle,
      href: '/feelings/career',
      iconSlug: 'career',
    },
    {
      slug: 'zodiac',
      label: copy.home.meaningZodiacTitle,
      subtitle: copy.home.meaningZodiacSubtitle,
      href: '/products?category=zodiac',
      iconSlug: 'zodiac',
    },
  ];

  return tiles.map((override, index) => ({
    feeling: {
      slug: override.slug,
      name: override.label ?? override.slug,
      active: true,
      accent: HOME_FEELING_TILE_SURFACES[index % HOME_FEELING_TILE_SURFACES.length],
      blurb: override.subtitle ?? '',
      tagline: override.subtitle ?? '',
    },
    index,
    count: 0,
    override,
  }));
}

export function HomeFeelingCards({ section }: { section?: StorefrontHomepageSection }) {
  const { locale } = useUiLocale();
  const copy = useDictionary();
  const presentation = parseHomepagePresentation(
    section?.payload as Record<string, unknown> | null | undefined,
  );
  const sectionEyebrow = pickLocalizedStorefrontText(section?.eyebrow, locale as 'en' | 'ar');
  const sectionTitle = normalizeLegacyStorefrontLabel(
    pickLocalizedStorefrontText(section?.title, locale as 'en' | 'ar'),
    locale as 'en' | 'ar',
  );
  const sectionBody = pickLocalizedStorefrontText(section?.body, locale as 'en' | 'ar');
  const sectionCta = normalizeLegacyStorefrontLabel(
    pickLocalizedStorefrontText(section?.primaryCta?.label, locale as 'en' | 'ar'),
    locale as 'en' | 'ar',
  );
  const showSectionHeader = presentation.showEyebrow !== false || presentation.showBody !== false;
  const eyebrow =
    presentation.showEyebrow === false ? undefined : (sectionEyebrow ?? copy.home.feelingsRhythmEyebrow);
  const title = sectionTitle ?? copy.home.feelingsTitle;
  const subtitle =
    presentation.showBody === false ? undefined : (sectionBody ?? copy.home.feelingsSubtitle);
  const cta = sectionCta ?? copy.home.feelingsCta;
  const overrides = payloadFeelingOverrides(section, locale as 'en' | 'ar');
  const feelings =
    overrides.length > 0
      ? getFeaturedFeelings(section, locale as 'en' | 'ar')
      : launchMeaningTileEntries(copy);

  if (feelings.length === 0) {
    return null;
  }

  return (
    <section
      id="shop-by-meaning"
      aria-labelledby="home-feelings-title"
      className="home-section bg-horo-section px-4 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        {showSectionHeader ? (
          <div className="mb-6 flex items-end justify-between gap-4 md:mb-8" data-reveal>
            <div>
              {eyebrow ? <p className="home-section-eyebrow">{eyebrow}</p> : null}
              <h2
                id="home-feelings-title"
                className={`home-section-title text-[1.75rem] md:text-[2rem] ${eyebrow ? 'mt-2' : ''}`}
              >
                {title}
              </h2>
              {subtitle ? (
                <p className="font-body mt-2 hidden text-sm leading-relaxed text-warm-charcoal md:block md:text-base">
                  {subtitle}
                </p>
              ) : null}
            </div>
            {section?.primaryCta?.href && cta ? (
              <Link
                href={section.primaryCta.href}
                className="home-section-link font-body hidden min-h-11 items-center justify-center text-sm font-semibold text-horo-pulse transition-colors hover:text-horo-root sm:inline-flex focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-horo-pulse"
              >
                {cta}
                <span aria-hidden className="ms-1">
                  →
                </span>
              </Link>
            ) : null}
          </div>
        ) : (
          <h2 id="home-feelings-title" className="sr-only">
            {title}
          </h2>
        )}

        <div className="home-feeling-pastel-grid home-feeling-pastel-grid--meaning">
          {feelings.map(({ feeling, override }, index) => {
            const reveal = (['stagger-1', 'stagger-2', 'stagger-3', 'stagger-4', 'stagger-5'] as const)[index % 5];
            const surface = override?.surface ?? HOME_FEELING_TILE_SURFACES[index % HOME_FEELING_TILE_SURFACES.length];
            const label = override?.label ?? feeling.name;
            const tileSubtitle = override?.subtitle ?? feeling.tagline ?? feeling.blurb;
            const href = override?.href ?? `/feelings/${feeling.slug}`;
            const iconSlug = override?.iconSlug ?? feeling.slug;
            const tileImageSrc =
              override?.imageSrc ??
              HOME_MEANING_TILE_IMAGES[feeling.slug] ??
              HOME_MEANING_TILE_IMAGES[iconSlug];
            const useEditorialTile =
              Boolean(tileImageSrc) && !isUnavailableHomepageReferenceImageSrc(tileImageSrc);
            const tileStyle = useEditorialTile
              ? { backgroundImage: `url(${tileImageSrc})` }
              : { backgroundColor: surface };

            return (
              <Link
                key={feeling.slug}
                id={`feeling-${feeling.slug}`}
                href={href}
                data-reveal={reveal}
                onClick={() => trackMeaningTileClick(feeling.slug, label, href)}
                className={`home-feeling-pastel-tile focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-horo-pulse${useEditorialTile ? ' home-feeling-tile--editorial' : ''}`}
                style={tileStyle}
              >
                {!useEditorialTile ? (
                  <span className="home-feeling-pastel-tile__icon text-horo-pulse">
                    <FeelingTileIcon slug={iconSlug} />
                  </span>
                ) : null}
                <span className="home-feeling-pastel-tile__label">{label}</span>
                {tileSubtitle ? (
                  <span className="home-feeling-pastel-tile__subtitle">{tileSubtitle}</span>
                ) : null}
              </Link>
            );
          })}
        </div>

        {section?.primaryCta?.href && cta && showSectionHeader ? (
          <div className="mt-6 sm:hidden">
            <Link
              href={section.primaryCta.href}
              className="font-body inline-flex min-h-11 items-center justify-center text-sm font-medium text-horo-pulse underline-offset-4 transition-colors hover:text-horo-root hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-horo-pulse"
            >
              {cta}
              <span aria-hidden className="ms-1">
                →
              </span>
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
