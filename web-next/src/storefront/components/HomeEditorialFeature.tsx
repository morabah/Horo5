import Image from 'next/image';
import Link from 'next/link';

import { trackCloserLookClick, trackEditorialFeatureCtaClick } from '../analytics/events';
import {
  pickLocalizedStorefrontText,
  type StorefrontHomepageSection,
} from '../data/catalog-types';
import { useDictionary, useUiLocale } from '../i18n/ui-locale';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function payloadAnchor(section: StorefrontHomepageSection | undefined): string {
  const payload = isRecord(section?.payload) ? section.payload : null;
  const anchor = typeof payload?.anchorId === 'string' ? payload.anchorId.trim() : '';
  return anchor || 'editorial-feature';
}

export function HomeEditorialFeature({ section }: { section?: StorefrontHomepageSection }) {
  const { locale } = useUiLocale();
  const copy = useDictionary();
  const resolvedLocale = locale as 'en' | 'ar';
  const payload = isRecord(section?.payload) ? section.payload : null;
  const variant = typeof payload?.variant === 'string' ? payload.variant : 'closer_look';

  const eyebrow =
    pickLocalizedStorefrontText(section?.eyebrow, resolvedLocale) ??
    (variant === 'closer_look' ? 'A Closer Look' : copy.home.behindThePieceEyebrow);
  const title = pickLocalizedStorefrontText(section?.title, resolvedLocale);
  const body = pickLocalizedStorefrontText(section?.body, resolvedLocale);
  const imageSrc = section?.image?.src?.trim();
  const imageAlt =
    pickLocalizedStorefrontText(section?.image?.alt, resolvedLocale) ??
    (title ? `HORO — ${title}` : 'HORO editorial feature');
  const ctaLabel =
    pickLocalizedStorefrontText(section?.primaryCta?.label, resolvedLocale) ?? 'Shop the Piece';
  const ctaHref = section?.primaryCta?.href?.trim() ?? '/products';

  if (!title && !body && !imageSrc) {
    return null;
  }

  const sectionId = payloadAnchor(section);

  return (
    <section
      id={sectionId}
      aria-labelledby={`${sectionId}-title`}
      className="home-section bg-horo-white px-4 py-6 sm:px-6 md:py-8 lg:px-8"
    >
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2 md:items-center md:gap-10">
        {imageSrc ? (
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[4px] bg-[#faf7f6] md:aspect-[5/6]">
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        ) : null}
        <div>
          <p className="home-section-eyebrow">{eyebrow}</p>
          {title ? (
            <h2 id={`${sectionId}-title`} className="home-section-title mt-2">
              {title}
            </h2>
          ) : null}
          {body ? (
            <p className="font-body mt-4 text-[15px] leading-relaxed text-warm-charcoal md:text-base">
              {body}
            </p>
          ) : null}
          <Link
            href={ctaHref}
            onClick={() => {
              if (variant === 'closer_look') {
                trackCloserLookClick('editorial_feature', ctaHref);
              }
              trackEditorialFeatureCtaClick(variant, ctaHref);
            }}
            className="home-btn home-btn--primary font-body mt-6 inline-flex min-h-11 items-center justify-center rounded-[4px] bg-horo-pulse px-5 py-2 text-[12px] font-bold text-white hover:bg-horo-root focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-horo-pulse"
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
