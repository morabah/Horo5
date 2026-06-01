import Link from 'next/link';

import { HOME_FEELING_TILE_SURFACES } from '../data/homeContent';
import { FeelingTileIcon } from './home/FeelingTileIcon';
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
  const cta = sectionCta ?? copy.home.feelingsCta;
  const feelings = getFeaturedFeelings(section, locale as 'en' | 'ar');

  if (feelings.length === 0) {
    return null;
  }

  return (
    <section
      id="shop-by-feeling"
      aria-labelledby="home-feelings-title"
      className="home-section border-t border-stone/15 bg-horo-section px-4 py-5 sm:px-6 md:py-6 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-end justify-between gap-4" data-reveal>
          <div>
            <p className="home-section-eyebrow">{eyebrow}</p>
            <h2 id="home-feelings-title" className="home-section-title mt-2 text-[2rem]">
              {title}
            </h2>
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
            const iconSlug = override?.iconSlug ?? feeling.slug;
            const href = override?.href ?? `/feelings/${feeling.slug}`;

            return (
              <Link
                key={feeling.slug}
                id={`feeling-${feeling.slug}`}
                href={href}
                data-reveal={reveal}
                className="home-feeling-pastel-tile focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-horo-pulse"
                style={{ backgroundColor: surface }}
              >
                <FeelingTileIcon slug={iconSlug} className="home-feeling-pastel-tile__icon" />
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
