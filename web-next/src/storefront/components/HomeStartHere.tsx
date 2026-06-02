import Image from 'next/image';
import Link from 'next/link';

import { trackCloserLookClick } from '../analytics/events';
import {
  pickLocalizedStorefrontText,
  type StorefrontHomepageSection,
} from '../data/catalog-types';
import { resolveHomeProducts } from '../lib/resolveHomeProducts';
import { useUiLocale, useDictionary } from '../i18n/ui-locale';
import type { Product } from '../data/catalog-types';
import { HomeStartHereGroupedClient } from './HomeStartHereGroupedClient';

export function HomeStartHere({ products, section }: { products?: Product[]; section?: StorefrontHomepageSection }) {
  const { locale } = useUiLocale();
  const copy = useDictionary();
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

  if (featuredProducts.length === 0) {
    return null;
  }

  const shopHref = section?.primaryCta?.href ?? '/products';
  const closerLookHref = section?.secondaryCta?.href ?? '#editorial-feature';

  return (
    <section
      id="founding-drop"
      aria-labelledby="home-start-here-title"
      className="home-section border-t border-stone/15 bg-horo-white px-4 py-6 sm:px-6 md:py-7 lg:px-8"
    >
      <div className="home-founding-drop__inner mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="home-section-eyebrow">{sectionEyebrow ?? copy.home.startHereEyebrow}</p>
            <h2 id="home-start-here-title" data-reveal className="home-section-title mt-2">
              {sectionTitle ?? copy.home.startHereTitle}
            </h2>
            {(sectionBody ?? copy.home.startHereSubline) ? (
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

        {campaignImageSrc ? (
          <div className="home-founding-campaign" data-reveal>
            <div className="home-founding-campaign__media">
              <Image
                src={campaignImageSrc}
                alt={campaignImageAlt}
                fill
                sizes="(max-width: 1280px) 100vw, 1280px"
                className="object-cover"
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href={shopHref}
                className="home-btn home-btn--primary font-body inline-flex min-h-11 items-center justify-center rounded-[4px] bg-horo-pulse px-5 py-2 text-[12px] font-bold text-white hover:bg-horo-root focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-horo-pulse"
              >
                {copy.home.foundingCampaignCta}
              </Link>
              <Link
                href={closerLookHref}
                onClick={() => trackCloserLookClick('founding_drop', closerLookHref)}
                className="home-btn home-btn--secondary font-body inline-flex min-h-11 items-center justify-center rounded-[4px] border border-horo-pulse px-5 py-2 text-[12px] font-bold text-horo-root hover:bg-horo-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-horo-pulse"
              >
                {secondaryCtaLabel ?? copy.home.foundingCloserLookCta}
              </Link>
            </div>
          </div>
        ) : null}

        <HomeStartHereGroupedClient products={featuredProducts} />
      </div>
    </section>
  );
}
