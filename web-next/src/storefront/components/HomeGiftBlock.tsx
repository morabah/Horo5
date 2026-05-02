import Link from 'next/link';

import {
  pickLocalizedStorefrontText,
  type StorefrontHomepageSection,
} from '../data/catalog-types';
import { getProductComparisonImageSrc, imgUrl } from '../data/images';
import { getOccasions, getProducts, productHasRealImage } from '../data/site';
import { useUiLocale } from '../i18n/ui-locale';
import { TeeImage } from './TeeImage';

export function HomeGiftBlock({ section }: { section?: StorefrontHomepageSection }) {
  const { copy, locale } = useUiLocale();
  const sectionEyebrow = pickLocalizedStorefrontText(section?.eyebrow, locale as 'en' | 'ar');
  const sectionTitle = pickLocalizedStorefrontText(section?.title, locale as 'en' | 'ar');
  const sectionCta = pickLocalizedStorefrontText(section?.primaryCta?.label, locale as 'en' | 'ar');
  const giftOccasion = getOccasions()
    .filter((occasion) => occasion.active !== false && occasion.isGiftOccasion)
    .map((occasion, index) => ({ occasion, index }))
    .sort((a, b) => (a.occasion.sortOrder ?? a.index) - (b.occasion.sortOrder ?? b.index) || a.index - b.index)[0]?.occasion;
  const giftHref = section?.primaryCta?.href ?? (giftOccasion ? `/occasions/${giftOccasion.slug}` : '/gifts');
  const giftProduct =
    (giftOccasion
      ? getProducts().find((product) => product.occasionSlugs.includes(giftOccasion.slug) && productHasRealImage(product))
      : null) ?? getProducts().find(productHasRealImage);
  const giftImageSrc = giftProduct ? getProductComparisonImageSrc(giftProduct) : '';

  return (
    <section
      aria-labelledby="home-gift-title"
      className="border-t border-stone/20 bg-linen px-4 py-12 sm:px-5 md:py-14 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <div className={`grid grid-cols-1 items-center gap-6 md:gap-12 ${giftImageSrc ? 'md:grid-cols-2' : ''}`}>
          {giftImageSrc ? (
            <div data-reveal className="order-2 md:order-1">
              <div className="aspect-[4/3] w-full overflow-hidden rounded-[18px] border border-stone/40 bg-papyrus/50 shadow-[0_18px_44px_-30px_rgba(26,26,26,0.18)]">
                <TeeImage
                  src={imgUrl(giftImageSrc, 1200)}
                  alt={giftProduct ? `HORO ${giftProduct.name} gift-ready tee.` : 'HORO gift-ready tee.'}
                  w={1200}
                  className="h-full w-full"
                  objectPosition="center 18%"
                />
              </div>
            </div>
          ) : null}
          <div data-reveal="stagger-1" className="order-1 flex flex-col justify-center md:order-2">
            <p className="font-label text-[12px] font-semibold uppercase tracking-[0.2em] text-label">
              {sectionEyebrow ?? copy.home.giftEyebrow}
            </p>
            <h2
              id="home-gift-title"
              className="font-headline mt-2 text-[1.6rem] font-semibold leading-tight tracking-tight text-obsidian md:text-[1.75rem]"
            >
              {sectionTitle ?? copy.home.giftHeadline}
            </h2>
            <div className="mt-6">
              <Link
                href={giftHref}
                className="cta-clay font-body inline-flex min-h-12 items-center justify-center rounded-md border border-obsidian/80 bg-white px-7 py-3 text-sm font-semibold text-obsidian transition-colors hover:bg-obsidian hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
              >
                {sectionCta ?? copy.home.giftCta}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
