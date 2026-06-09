import {
  pickLocalizedStorefrontText,
  type StorefrontHomepageSection,
} from '../data/catalog-types';
import { HORO_SUPPORT_CHANNELS, isConfiguredExternalUrl } from '../data/support-channels';
import { HOME_SEEN_ON_YOU } from '../data/homeContent';
import { getProductComparisonImageSrc, heroVectorizedV2, imgUrl } from '../data/images';
import { getProducts, productHasRealImage } from '../data/site';
import { useDictionary, useUiLocale } from '../i18n/ui-locale';
import { TeeImage } from './TeeImage';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isCuratedAsset(src: string | undefined) {
  return Boolean(src && src.trim() && src !== heroVectorizedV2);
}

function galleryFromSection(section: StorefrontHomepageSection | undefined, locale: 'en' | 'ar') {
  const payload = isRecord(section?.payload) ? section.payload : null;
  const raw = Array.isArray(payload?.gallery) ? payload.gallery : Array.isArray(payload?.items) ? payload.items : [];
  return raw.flatMap((item) => {
    if (!isRecord(item)) return [];
    const imageSrc =
      (typeof item.imageSrc === 'string' && item.imageSrc.trim()) ||
      (typeof item.image_src === 'string' && item.image_src.trim()) ||
      '';
    if (!isCuratedAsset(imageSrc)) return [];
    const imageAlt =
      pickLocalizedStorefrontText(item.imageAlt as Parameters<typeof pickLocalizedStorefrontText>[0], locale) ??
      pickLocalizedStorefrontText(item.image_alt as Parameters<typeof pickLocalizedStorefrontText>[0], locale) ??
      'HORO lifestyle photo';
    const handle = typeof item.handle === 'string' ? item.handle : undefined;
    return [{ imageSrc, imageAlt, handle }];
  });
}

export function HomeDetailFallback() {
  const copy = useDictionary();
  const proofProduct = getProducts().find(productHasRealImage);
  const proofImageSrc = proofProduct ? getProductComparisonImageSrc(proofProduct) : '';

  return (
    <section
      aria-labelledby="home-detail-fallback-title"
      className="border-t border-stone/20 bg-papyrus px-4 py-12 sm:px-5 md:py-14 lg:px-8"
    >
      <div className={`home-detail-fallback mx-auto grid max-w-6xl gap-6 overflow-hidden rounded-[18px] border border-stone/55 bg-white/82 shadow-[0_18px_44px_-30px_rgba(26,26,26,0.18)] md:items-stretch ${
        proofImageSrc ? 'md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]' : ''
      }`}>
        <div className="flex flex-col justify-center p-6 md:p-8" data-reveal>
          <p className="font-label text-[12px] font-semibold uppercase tracking-[0.2em] text-label">
            {copy.home.seenOnYouTitle}
          </p>
          <h2 id="home-detail-fallback-title" className="font-headline mt-2 text-[1.6rem] font-semibold leading-tight tracking-tight text-obsidian md:text-[1.75rem]">
            {copy.home.detailFallbackTitle}
          </h2>
          <p className="mt-4 font-body text-[15px] leading-relaxed text-warm-charcoal md:text-base">
            {copy.home.detailFallbackBody}
          </p>
        </div>
        {proofImageSrc ? (
          <div className="relative min-h-[220px] bg-linen md:min-h-[320px]" data-reveal="stagger-1">
            <TeeImage
              src={imgUrl(proofImageSrc, 1000)}
              alt={proofProduct ? `HORO ${proofProduct.name} product detail.` : 'HORO product detail.'}
              w={1000}
              className="h-full w-full"
              objectPosition="center 18%"
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function HomeSeenOnYou({ section }: { section?: StorefrontHomepageSection }) {
  const copy = useDictionary();
  const { locale } = useUiLocale();
  const instagramUrl = isConfiguredExternalUrl(HORO_SUPPORT_CHANNELS.instagramUrl)
    ? HORO_SUPPORT_CHANNELS.instagramUrl
    : null;
  const cmsEntries = galleryFromSection(section, locale as 'en' | 'ar');
  const entries = (cmsEntries.length > 0 ? cmsEntries : HOME_SEEN_ON_YOU)
    .filter((entry) => isCuratedAsset(entry.imageSrc))
    .slice(0, 6);

  if (entries.length < 2) {
    return null;
  }

  return (
    <section
      id="seen-on-you"
      aria-labelledby="home-seen-on-you-title"
      className="home-section border-t border-stone/20 bg-papyrus px-4 py-12 sm:px-5 md:py-14 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="home-section-eyebrow">{copy.home.seenOnYouTitle}</p>
            <h2
              id="home-seen-on-you-title"
              className="home-section-title mt-2"
            >
              {copy.home.detailFallbackTitle}
            </h2>
          </div>
          {instagramUrl ? (
            <a
              href={instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="home-section-link font-body inline-flex min-h-11 items-center text-sm font-semibold text-horo-pulse transition-colors hover:text-horo-root"
            >
              {copy.home.seenOnYouFollowUs}
              <span aria-hidden className="ms-1">
                →
              </span>
            </a>
          ) : null}
        </div>
        <div className="home-ugc-grid grid grid-cols-2 gap-3 overflow-x-auto sm:grid-cols-3 sm:gap-4 md:overflow-visible">
          {entries.map((entry, index) => {
            return (
              <figure
                key={`${entry.imageSrc}-${index}`}
                className="min-w-[44%] overflow-hidden rounded-[18px] border border-stone/55 bg-white/82 shadow-[0_18px_44px_-30px_rgba(26,26,26,0.18)] sm:min-w-0"
              >
                <div className="relative aspect-[4/5] bg-linen">
                  <TeeImage
                    src={imgUrl(entry.imageSrc, 900)}
                    alt={entry.imageAlt}
                    w={900}
                    className="h-full w-full"
                  />
                </div>
                {entry.handle ? (
                  <figcaption className="font-body px-3 py-2 text-[13px] text-warm-charcoal">
                    {entry.handle}
                  </figcaption>
                ) : null}
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}
