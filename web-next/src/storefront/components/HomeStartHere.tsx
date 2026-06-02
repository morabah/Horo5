'use client';

import Link from 'next/link';
import { useState } from 'react';

import { trackCloserLookClick } from '../analytics/events';
import {
  pickLocalizedStorefrontText,
  type StorefrontHomepageSection,
} from '../data/catalog-types';
import { resolveHomeProducts } from '../lib/resolveHomeProducts';
import { isImageOverlayPresentation, parseHomepagePresentation } from '../lib/parseHomepagePresentation';
import { useUiLocale, useDictionary } from '../i18n/ui-locale';
import type { Product } from '../data/catalog-types';
import { HomeFoundingRail } from './home/HomeFoundingRail';
import { HomeImageCampaign } from './home/HomeImageCampaign';

export function HomeStartHere({ products, section }: { products?: Product[]; section?: StorefrontHomepageSection }) {
  const { locale } = useUiLocale();
  const copy = useDictionary();
  const [campaignImageFailed, setCampaignImageFailed] = useState(false);
  const sectionPayload = section?.payload as Record<string, unknown> | null | undefined;
  const presentation = parseHomepagePresentation(sectionPayload);
  const sectionEyebrow = pickLocalizedStorefrontText(section?.eyebrow, locale as 'en' | 'ar');
  const sectionTitle = pickLocalizedStorefrontText(section?.title, locale as 'en' | 'ar');
  const sectionBody = pickLocalizedStorefrontText(section?.body, locale as 'en' | 'ar');
  const sectionCta = pickLocalizedStorefrontText(section?.primaryCta?.label, locale as 'en' | 'ar');
  const secondaryCtaLabel = pickLocalizedStorefrontText(section?.secondaryCta?.label, locale as 'en' | 'ar');
  const campaignImageSrc = section?.image?.src?.trim();
  const campaignImageAlt =
    pickLocalizedStorefrontText(section?.image?.alt, locale as 'en' | 'ar') ??
    'The Founding Drop campaign';
  const featuredProducts = resolveHomeProducts(products, section);
  const showBody = presentation.showBody !== false && Boolean(sectionBody ?? copy.home.startHereSubline);
  const wantsCampaignOverlay =
    Boolean(campaignImageSrc) &&
    (isImageOverlayPresentation(sectionPayload) || presentation.layout === 'image_overlay');
  const showCampaignOverlay = wantsCampaignOverlay && !campaignImageFailed;

  if (featuredProducts.length === 0) {
    return null;
  }

  const shopHref = section?.primaryCta?.href ?? '/products';
  const closerLookHref = section?.secondaryCta?.href ?? '#editorial-feature';
  const showTextHeader = !showCampaignOverlay;

  return (
    <section
      id="founding-drop"
      aria-labelledby="home-start-here-title"
      className="home-section bg-horo-white px-4 py-6 sm:px-6 md:py-7 lg:px-8"
    >
      <div className="home-founding-drop__inner mx-auto max-w-6xl">
        {showCampaignOverlay && campaignImageSrc ? (
          <div className="mb-8 sm:mb-10" data-reveal>
            <HomeImageCampaign
              id="founding-drop-campaign"
              titleId="home-start-here-title"
              eyebrow={sectionEyebrow ?? copy.home.startHereEyebrow}
              title={sectionTitle ?? copy.home.startHereTitle}
              body={showBody ? (sectionBody ?? copy.home.startHereSubline) : undefined}
              imageSrc={campaignImageSrc}
              imageAlt={campaignImageAlt}
              primaryCta={{
                label: sectionCta ?? copy.home.foundingCampaignCta,
                href: shopHref,
              }}
              secondaryCta={
                secondaryCtaLabel
                  ? {
                      label: secondaryCtaLabel,
                      href: closerLookHref,
                    }
                  : undefined
              }
              presentation={{
                ...presentation,
                layout: 'image_overlay',
                showBody,
                showEyebrow: presentation.showEyebrow !== false,
              }}
              minHeight="min-h-[min(40vh,22rem)]"
              onImageError={() => setCampaignImageFailed(true)}
              onSecondaryClick={() => trackCloserLookClick('founding_drop', closerLookHref)}
            />
          </div>
        ) : null}

        {showTextHeader ? (
          <div className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="home-section-eyebrow">{sectionEyebrow ?? copy.home.startHereEyebrow}</p>
              <h2 id="home-start-here-title" className="home-section-title mt-2">
                {sectionTitle ?? copy.home.startHereTitle}
              </h2>
              {showBody ? (
                <p className="font-body mt-2 max-w-2xl text-sm leading-relaxed text-warm-charcoal md:text-base">
                  {sectionBody ?? copy.home.startHereSubline}
                </p>
              ) : null}
            </div>
            <Link
              href={shopHref}
              className="home-section-link font-body inline-flex min-h-11 w-fit items-center justify-center text-sm font-semibold text-horo-pulse transition-colors hover:text-horo-root focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-horo-pulse"
            >
              {sectionCta ?? copy.home.startHereViewAll}
              <span aria-hidden className="ms-1">
                →
              </span>
            </Link>
          </div>
        ) : null}

        <HomeFoundingRail products={featuredProducts} />
      </div>
    </section>
  );
}
