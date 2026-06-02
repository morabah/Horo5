'use client';

import Link from 'next/link';
import { useMemo } from 'react';

import { trackHomeProductCardClick } from '../../analytics/events';
import { getProductCardImageSrc, isGenericBrandPlaceholderSrc } from '../../data/images';
import { getProduct, type Product } from '../../data/site';
import { useDictionary, useUiLocale } from '../../i18n/ui-locale';
import { launchProductEyebrow } from '../../lib/launch-taxonomy-display';
import { AppIcon } from '../AppIcon';
import { TeeImageFrame } from '../TeeImage';
import { HoroArtworkPlaceholder } from './HoroArtworkPlaceholder';

const homePriceFormatter = new Intl.NumberFormat('en-EG', {
  maximumFractionDigits: 0,
  useGrouping: true,
});

function formatHomeEgp(amount: number) {
  return `EGP ${homePriceFormatter.format(amount)}`;
}

export function HomeFoundingProductCard({
  product,
  eager = false,
  'data-reveal': dataReveal,
}: {
  product: Product;
  eager?: boolean;
  'data-reveal'?: string;
}) {
  const copy = useDictionary();
  const { locale } = useUiLocale();
  const isArabic = locale === 'ar';
  const catalogProduct = useMemo(() => getProduct(product.slug) ?? product, [product]);
  const imageSrc = getProductCardImageSrc(catalogProduct);
  const useArtworkPlaceholder = isGenericBrandPlaceholderSrc(imageSrc);
  const displayName = product.name;
  const displayPrice = product.priceEgp;
  const launchEyebrow = launchProductEyebrow(catalogProduct);
  const displayImageAlt = `HORO "${product.name}" graphic tee`;
  const pdpHref = `/products/${product.slug}`;
  const chooseSizeLabel = isArabic ? 'اختر المقاس' : 'Choose size';

  return (
    <article className="home-founding-card flex h-full flex-col overflow-hidden rounded-[4px] bg-white shadow-[0_1px_0_rgba(79,17,31,0.04)] transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(79,17,31,0.05)]" data-reveal={dataReveal}>
      <Link
        href={pdpHref}
        onClick={() => trackHomeProductCardClick(product.slug, pdpHref)}
        className="home-founding-card__media block bg-[#faf7f6] p-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-horo-pulse"
        aria-label={displayName}
      >
        {useArtworkPlaceholder ? (
          <div className="relative aspect-[4/5] w-full">
            <HoroArtworkPlaceholder ariaLabel={displayImageAlt} />
          </div>
        ) : (
          <TeeImageFrame
            src={imageSrc}
            alt={displayImageAlt}
            w={800}
            aspectRatio="4/5"
            borderRadius="0"
            eager={eager}
            objectPosition="center 22%"
            frameStyle={{ marginBottom: 0, minHeight: '100%' }}
            sizes="(max-width: 640px) 46vw, (max-width: 1100px) 30vw, 240px"
          />
        )}
      </Link>
      <div className="home-founding-card__body flex flex-1 flex-col p-4 text-center sm:text-start">
        <Link
          href={pdpHref}
          onClick={() => trackHomeProductCardClick(product.slug, pdpHref)}
          className="font-headline text-[15px] font-semibold leading-snug text-horo-root transition-colors hover:text-horo-pulse md:text-[16px]"
        >
          {displayName}
        </Link>
        {launchEyebrow ? (
          <p className="font-label mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-horo-pulse/85">
            {launchEyebrow}
          </p>
        ) : null}
        <p className="home-founding-card__price mt-2 font-semibold text-[#50484b]">
          {formatHomeEgp(displayPrice)}
        </p>
        <div className="mt-auto pt-3.5">
          <Link
            href={pdpHref}
            onClick={() => trackHomeProductCardClick(product.slug, pdpHref)}
            className="home-founding-card__cta font-body relative inline-flex min-h-9 w-full items-center justify-center rounded-[4px] border border-horo-pulse/55 px-3 py-2 text-[0.8rem] font-semibold text-horo-pulse transition-colors hover:border-horo-pulse hover:bg-horo-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-horo-pulse"
          >
            <span>{chooseSizeLabel}</span>
            <AppIcon name="shopping_bag" className="absolute right-3 h-3.5 w-3.5" strokeWidth={1.7} />
          </Link>
        </div>
      </div>
    </article>
  );
}
