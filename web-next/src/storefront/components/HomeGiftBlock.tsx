'use client';

import Link from 'next/link';
import { useState } from 'react';

import { trackHomeGiftCtaClick } from '../analytics/events';
import {
  pickLocalizedStorefrontText,
  type StorefrontHomepageSection,
} from '../data/catalog-types';
import { pickGiftBlockImageSrc } from '../data/images';
import { getOccasions, getProducts, productHasRealImage } from '../data/site';
import { useUiLocale, useDictionary } from '../i18n/ui-locale';
import { isImageOverlayPresentation, parseHomepagePresentation } from '../lib/parseHomepagePresentation';
import { HomeImageCampaign } from './home/HomeImageCampaign';

const HOME_GIFT_IMAGE_SRC = '/images/homepage-reference/gift-box.png';

export function HomeGiftBlock({ section }: { section?: StorefrontHomepageSection }) {
  const { locale } = useUiLocale();
  const copy = useDictionary();
  const [imageFailed, setImageFailed] = useState(false);
  const sectionPayload = section?.payload as Record<string, unknown> | null | undefined;
  const presentation = parseHomepagePresentation(sectionPayload);
  const sectionEyebrow = pickLocalizedStorefrontText(section?.eyebrow, locale as 'en' | 'ar');
  const sectionTitle = pickLocalizedStorefrontText(section?.title, locale as 'en' | 'ar');
  const sectionBody = pickLocalizedStorefrontText(section?.body, locale as 'en' | 'ar');
  const sectionCta = pickLocalizedStorefrontText(section?.primaryCta?.label, locale as 'en' | 'ar');
  const sectionImageAlt = pickLocalizedStorefrontText(section?.image?.alt, locale as 'en' | 'ar');
  const giftOccasion = getOccasions()
    .filter((occasion) => occasion.active !== false && occasion.isGiftOccasion)
    .map((occasion, index) => ({ occasion, index }))
    .sort((a, b) => (a.occasion.sortOrder ?? a.index) - (b.occasion.sortOrder ?? b.index) || a.index - b.index)[0]?.occasion;
  const giftHref = section?.primaryCta?.href ?? (giftOccasion ? `/occasions/${giftOccasion.slug}` : '/gifts');
  const giftProduct =
    (giftOccasion
      ? getProducts().find((product) => product.occasionSlugs.includes(giftOccasion.slug) && productHasRealImage(product))
      : null) ?? getProducts().find(productHasRealImage);
  const giftImageSrc =
    pickGiftBlockImageSrc({
      sectionImage: section?.image?.src?.trim(),
      product: giftProduct ?? undefined,
      packagingFallback: HOME_GIFT_IMAGE_SRC,
    }) ?? HOME_GIFT_IMAGE_SRC;
  const headline = sectionTitle ?? copy.home.giftHeadline;
  const body = sectionBody ?? copy.home.giftBody;
  const eyebrow = sectionEyebrow ?? copy.home.giftEyebrow;
  const cta = sectionCta ?? copy.home.giftCta;
  const wantsOverlay = Boolean(giftImageSrc) && isImageOverlayPresentation(sectionPayload);
  const showOverlay = wantsOverlay && !imageFailed;

  return (
    <section
      id="gift-by-meaning"
      aria-labelledby="home-gift-title"
      className="home-section bg-horo-section px-4 py-5 sm:px-6 md:py-6 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        {showOverlay ? (
          <HomeImageCampaign
            id="gift-block-campaign"
            titleId="home-gift-title"
            eyebrow={eyebrow}
            title={headline}
            body={body}
            imageSrc={giftImageSrc}
            imageAlt={
              sectionImageAlt ??
              (giftProduct ? `HORO ${giftProduct.name} gift-ready tee.` : 'HORO gift-ready package.')
            }
            primaryCta={{ label: cta, href: giftHref }}
            presentation={{
              ...presentation,
              layout: 'image_overlay',
              showEyebrow: presentation.showEyebrow !== false,
              showBody: presentation.showBody !== false,
            }}
            minHeight="min-h-[min(44vh,24rem)]"
            onImageError={() => setImageFailed(true)}
            onPrimaryClick={() => trackHomeGiftCtaClick(giftHref)}
          />
        ) : (
          <div className="home-gift-banner overflow-hidden rounded-[4px] bg-[#fbf5f3] p-6 md:p-8">
            <p className="home-section-eyebrow">{eyebrow}</p>
            <h2 id="home-gift-title" className="home-gift-banner__title mt-2">
              {headline}
            </h2>
            <p className="mt-4 max-w-md font-body text-[0.9rem] leading-snug text-[#5a5154]">{body}</p>
            <Link
              href={giftHref}
              onClick={() => trackHomeGiftCtaClick(giftHref)}
              className="home-btn home-btn--primary font-body mt-5 inline-flex min-h-[42px] items-center justify-center rounded-[4px] bg-horo-pulse px-7 py-2 text-sm font-bold text-white hover:bg-horo-root"
            >
              {cta}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
