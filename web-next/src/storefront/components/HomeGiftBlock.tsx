import Link from 'next/link';

import { trackHomeGiftCtaClick } from '../analytics/events';
import {
  pickLocalizedStorefrontText,
  type StorefrontHomepageSection,
} from '../data/catalog-types';
import {
  getProductComparisonImageSrc,
  isBackLikeProductImageSrc,
  pickHomeCardImageSrc,
} from '../data/images';
import { getOccasions, getProducts, productHasRealImage } from '../data/site';
import { useUiLocale, useDictionary } from '../i18n/ui-locale';
import { TeeImage } from './TeeImage';

const HOME_GIFT_IMAGE_SRC = '/images/homepage-reference/gift-box.png';

export function HomeGiftBlock({ section }: { section?: StorefrontHomepageSection }) {
  const { locale } = useUiLocale();
  const copy = useDictionary();
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
  const sectionImage = section?.image?.src?.trim();
  const productCardImage = giftProduct ? pickHomeCardImageSrc(giftProduct) : undefined;
  const comparisonImage =
    giftProduct && !isBackLikeProductImageSrc(getProductComparisonImageSrc(giftProduct))
      ? getProductComparisonImageSrc(giftProduct)
      : undefined;
  const giftImageSrc =
    (sectionImage && !isBackLikeProductImageSrc(sectionImage) ? sectionImage : undefined) ??
    (productCardImage && !isBackLikeProductImageSrc(productCardImage) ? productCardImage : undefined) ??
    comparisonImage ??
    HOME_GIFT_IMAGE_SRC;
  const showGiftImage = Boolean(giftImageSrc);
  const headline = sectionTitle ?? copy.home.giftHeadline;
  const headlineLine2 = sectionTitle ? null : copy.home.giftHeadlineLine2;
  const eyebrow = sectionEyebrow ?? copy.home.giftEyebrow;
  const body = sectionBody ?? copy.home.giftBody;
  const cta = sectionCta ?? copy.home.giftCta;

  return (
    <section
      id="gift-by-meaning"
      aria-labelledby="home-gift-title"
      className="home-section bg-horo-section px-4 py-5 sm:px-6 md:py-6 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <div
          className={`home-gift-banner overflow-hidden rounded-[4px] bg-[#fbf5f3] shadow-[0_1px_0_rgba(79,17,31,0.04)] ${
            showGiftImage ? 'md:grid md:grid-cols-[0.36fr_0.64fr]' : ''
          }`}
        >
          <div data-reveal className="flex flex-col justify-center p-6 md:p-8">
            <p className="home-section-eyebrow">{eyebrow}</p>
            <h2 id="home-gift-title" className="home-gift-banner__title mt-2">
              {headline}
              {headlineLine2 ? (
                <>
                  <br />
                  {headlineLine2}
                </>
              ) : null}
            </h2>
            <p className="mt-4 max-w-md font-body text-[0.9rem] leading-snug text-[#5a5154]">
              {body}
            </p>
            <div className="mt-5">
              <Link
                href={giftHref}
                onClick={() => trackHomeGiftCtaClick(giftHref)}
                className="home-btn home-btn--primary font-body inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[4px] bg-horo-pulse px-7 py-2 text-sm font-bold text-white transition-[transform,background-color] hover:bg-horo-root focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-horo-pulse"
              >
                {cta}
              </Link>
            </div>
          </div>
          {showGiftImage ? (
            <div data-reveal="stagger-1" className="relative min-h-[13rem] md:min-h-full">
              <TeeImage
                src={giftImageSrc}
                alt={sectionImageAlt ?? (giftProduct ? `HORO ${giftProduct.name} gift-ready tee.` : 'HORO gift-ready package.')}
                w={1200}
                className="h-full min-h-[13rem] w-full object-cover"
                objectPosition="center center"
              />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
