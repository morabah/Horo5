import Link from 'next/link';

import { trackMeaningTileClick } from '../analytics/events';
import { getFeelingCollectionVisual } from '../data/images';
import { HOME_FEELING_TILE_SURFACES } from '../data/homeContent';
import {
  pickLocalizedStorefrontText,
  type StorefrontHomepageSection,
} from '../data/catalog-types';
import { getFeelings, productHasRealImage, productsByFeeling } from '../data/site';
import { useUiLocale, useDictionary } from '../i18n/ui-locale';

type FeelingTileOverride = {
  slug: string;
  label?: string;
  iconSlug?: string;
  surface?: string;
  href?: string;
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
    return [{
      slug,
      label: localizedPayloadText(item.label ?? item.name ?? item.title, locale),
      iconSlug: typeof iconValue === 'string' ? iconValue : undefined,
      surface: typeof surfaceValue === 'string' ? surfaceValue : undefined,
      href: typeof hrefValue === 'string' ? hrefValue : undefined,
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
            blurb: '',
            tagline: '',
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

export function HomeFeelingCards({ section }: { section?: StorefrontHomepageSection }) {
  const { locale } = useUiLocale();
  const copy = useDictionary();
  const sectionEyebrow = pickLocalizedStorefrontText(section?.eyebrow, locale as 'en' | 'ar');
  const sectionTitle = pickLocalizedStorefrontText(section?.title, locale as 'en' | 'ar');
  const sectionCta = pickLocalizedStorefrontText(section?.primaryCta?.label, locale as 'en' | 'ar');
  const eyebrow = sectionEyebrow ?? copy.home.feelingsRhythmEyebrow;
  const title = sectionTitle ?? copy.home.feelingsTitle;
  const subtitle = copy.home.feelingsSubtitle;
  const cta = sectionCta ?? copy.home.feelingsCta;
  const feelings = getFeaturedFeelings(section, locale as 'en' | 'ar');

  if (feelings.length === 0) {
    return null;
  }

  return (
    <section
      id="shop-by-meaning"
      aria-labelledby="home-feelings-title"
      className="home-section bg-horo-section px-4 py-5 sm:px-6 md:py-6 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-end justify-between gap-4" data-reveal>
          <div>
            <p className="home-section-eyebrow">{eyebrow}</p>
            <h2 id="home-feelings-title" className="home-section-title mt-2 text-[2rem]">
              {title}
            </h2>
            {subtitle ? (
              <p className="font-body mt-2 text-sm leading-relaxed text-warm-charcoal md:text-base">
                {subtitle}
              </p>
            ) : null}
          </div>
          <Link
            href={section?.primaryCta?.href ?? '/feelings'}
            className="home-section-link font-body hidden min-h-11 items-center justify-center text-sm font-semibold text-horo-pulse transition-colors hover:text-horo-root sm:inline-flex focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-horo-pulse"
          >
            {cta}
            <span aria-hidden className="ms-1">
              →
            </span>
          </Link>
        </div>

        <div className="home-feeling-pastel-grid">
          {feelings.map(({ feeling, override }, index) => {
            const reveal = (['stagger-1', 'stagger-2', 'stagger-3', 'stagger-4', 'stagger-5'] as const)[index % 5];
            const surface = override?.surface ?? HOME_FEELING_TILE_SURFACES[index % HOME_FEELING_TILE_SURFACES.length];
            const label = override?.label ?? feeling.name;
            const href = override?.href ?? `/feelings/${feeling.slug}`;
            const visual = getFeelingCollectionVisual(feeling.slug);
            const tileImage = visual.hero.src || visual.cover.src;
            const tileStyle = tileImage
              ? {
                  backgroundImage: `linear-gradient(to top, rgba(36,31,33,0.75), rgba(36,31,33,0.2)), url(${tileImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : { backgroundColor: surface };

            return (
              <Link
                key={feeling.slug}
                id={`feeling-${feeling.slug}`}
                href={href}
                data-reveal={reveal}
                onClick={() => trackMeaningTileClick(feeling.slug, label, href)}
                className={`home-feeling-pastel-tile focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-horo-pulse${tileImage ? ' home-feeling-tile--editorial' : ''}`}
                style={tileStyle}
              >
                <span className="home-feeling-pastel-tile__label">{label}</span>
              </Link>
            );
          })}
        </div>

        <div className="mt-6 sm:hidden">
          <Link
            href={section?.primaryCta?.href ?? '/feelings'}
            className="font-body inline-flex min-h-11 items-center justify-center text-sm font-medium text-horo-pulse underline-offset-4 transition-colors hover:text-horo-root hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-horo-pulse"
          >
            {cta}
            <span aria-hidden className="ms-1">
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
