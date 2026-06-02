'use client';

import Link from 'next/link';
import { useState } from 'react';

import {
  type LocalizedStorefrontText,
  pickLocalizedStorefrontText,
  type StorefrontHomepageSection,
} from '../../data/catalog-types';
import { useDictionary, useUiLocale } from '../../i18n/ui-locale';
import { isImageOverlayPresentation, parseHomepagePresentation } from '../../lib/parseHomepagePresentation';
import { HomeImageCampaign } from './HomeImageCampaign';

const STORY_PILLAR_KEYS = ['localArtists', 'madeToFeelPersonal', 'realProofOnly'] as const;
type StoryPillarKey = (typeof STORY_PILLAR_KEYS)[number];

type StoryPillar = {
  body: string;
  icon: StoryPillarKey;
  id: string;
  title: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isStoryPillarKey(value: unknown): value is StoryPillarKey {
  return typeof value === 'string' && (STORY_PILLAR_KEYS as readonly string[]).includes(value);
}

function localizedPayloadText(value: unknown, locale: 'en' | 'ar') {
  if (typeof value !== 'string' && !isRecord(value)) return undefined;
  return pickLocalizedStorefrontText(value as LocalizedStorefrontText, locale);
}

function storyPillarsFromSection(
  section: StorefrontHomepageSection | undefined,
  locale: 'en' | 'ar',
): StoryPillar[] {
  const payload = isRecord(section?.payload) ? section.payload : null;
  const raw =
    (Array.isArray(payload?.pillars) && payload.pillars) ||
    (Array.isArray(payload?.items) && payload.items) ||
    [];

  return raw.flatMap((item, index): StoryPillar[] => {
    if (!isRecord(item)) return [];
    const keyValue = item.key ?? item.id ?? `pillar-${index}`;
    const id = typeof keyValue === 'string' && keyValue.trim() ? keyValue.trim() : `pillar-${index}`;
    const title = localizedPayloadText(item.title ?? item.label, locale);
    const body = localizedPayloadText(item.body ?? item.text ?? item.description, locale);
    if (!title || !body) return [];

    return [{
      body,
      icon: isStoryPillarKey(item.icon) ? item.icon : isStoryPillarKey(item.key) ? item.key : 'realProofOnly',
      id,
      title,
    }];
  });
}

function StoryPillarIcon({ name }: { name: (typeof STORY_PILLAR_KEYS)[number] }) {
  const stroke = 'currentColor';
  const common = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke,
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  };

  if (name === 'localArtists') {
    return (
      <svg {...common}>
        <path d="M12 19l7-7 3 3-7 7-3-3z" />
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
      </svg>
    );
  }
  if (name === 'madeToFeelPersonal') {
    return (
      <svg {...common}>
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
    </svg>
  );
}

export function HomeOurStory({ section }: { section?: StorefrontHomepageSection }) {
  const copy = useDictionary();
  const { locale } = useUiLocale();
  const resolvedLocale = locale as 'en' | 'ar';
  const isArabic = locale === 'ar';
  const sectionPayload = section?.payload as Record<string, unknown> | null | undefined;
  const presentation = parseHomepagePresentation(sectionPayload);
  const sectionEyebrow = pickLocalizedStorefrontText(section?.eyebrow, resolvedLocale);
  const sectionTitle = pickLocalizedStorefrontText(section?.title, resolvedLocale);
  const sectionBody = pickLocalizedStorefrontText(section?.body, resolvedLocale);
  const sectionCta = pickLocalizedStorefrontText(section?.primaryCta?.label, resolvedLocale);
  const ctaHref = section?.primaryCta?.href ?? '/about';
  const showPillars = presentation.showPillars === true;
  const payloadPillars = storyPillarsFromSection(section, resolvedLocale);
  const pillars =
    payloadPillars.length > 0
      ? payloadPillars
      : STORY_PILLAR_KEYS.map((key) => ({
          body: copy.home.ourStoryPillars[key].body,
          icon: key,
          id: key,
          title: copy.home.ourStoryPillars[key].title,
        }));
  const storyImageSrc = section?.image?.src?.trim();
  const storyImageAlt =
    pickLocalizedStorefrontText(section?.image?.alt, resolvedLocale) ??
    (isArabic ? 'قصة هورو' : 'HORO brand story');
  const title = sectionTitle ?? copy.home.ourStoryTitle;
  const [imageFailed, setImageFailed] = useState(false);
  const wantsOverlay = Boolean(storyImageSrc) && isImageOverlayPresentation(sectionPayload);
  const showOverlay = wantsOverlay && !imageFailed;

  return (
    <section
      id="our-story"
      aria-labelledby="home-our-story-title"
      className="home-section home-our-story bg-horo-soft px-4 py-7 sm:px-6 md:py-8 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        {showOverlay && storyImageSrc ? (
          <HomeImageCampaign
            id="our-story-campaign"
            titleId="home-our-story-title"
            eyebrow={sectionEyebrow ?? copy.home.ourStoryEyebrow}
            title={title}
            body={sectionBody ?? undefined}
            imageSrc={storyImageSrc}
            imageAlt={storyImageAlt}
            primaryCta={{ label: sectionCta ?? copy.home.ourStoryCta, href: ctaHref }}
            presentation={{
              ...presentation,
              layout: 'image_overlay',
              showBody: presentation.showBody === true,
              showEyebrow: presentation.showEyebrow !== false,
            }}
            minHeight="min-h-[min(44vh,24rem)]"
            onImageError={() => setImageFailed(true)}
          />
        ) : (
        <div className="home-our-story__layout">
        <div>
          <p className="home-section-eyebrow">{sectionEyebrow ?? copy.home.ourStoryEyebrow}</p>
          <h2 id="home-our-story-title" className="home-our-story__title mt-2">
            {title}
          </h2>
          {sectionBody ?? copy.home.ourStoryBody ? (
            <p className="home-our-story__body mt-5 max-w-xl">
              {sectionBody ?? copy.home.ourStoryBody}
            </p>
          ) : null}
          <Link
            href={ctaHref}
            className="home-btn home-btn--primary font-body mt-6 inline-flex min-h-11 items-center justify-center rounded-[4px] bg-horo-pulse px-5 py-2 text-[12px] font-bold text-white hover:bg-horo-root"
          >
            {sectionCta ?? copy.home.ourStoryCta}
          </Link>
        </div>

        {showPillars ? (
          <div className="home-our-story__side">
            <ul className="home-our-story__pillars" role="list">
              {pillars.map((pillar) => (
                <li key={pillar.id} className="home-our-story__pillar">
                  <span className="home-our-story__pillar-icon">
                    <StoryPillarIcon name={pillar.icon} />
                  </span>
                  <span>
                    <h3>{pillar.title}</h3>
                    <p>{pillar.body}</p>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        </div>
        )}
      </div>
    </section>
  );
}
