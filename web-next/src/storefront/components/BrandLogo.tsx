import Image from 'next/image';

import { BRAND_LOGO, BRAND_NAME } from '../data/brand';
import { useUiLocale } from '../i18n/ui-locale';

type BrandLogoProps = {
  variant?: 'dark' | 'light';
  className?: string;
  showArabic?: boolean;
  /** Header (default), footer, drawer/mobile density. */
  size?: 'header' | 'footer' | 'drawer';
};

function logoHeight(size: BrandLogoProps['size']) {
  if (size === 'footer') return BRAND_LOGO.footerHeightPx;
  if (size === 'drawer') return BRAND_LOGO.mobileHeaderHeightPx;
  return BRAND_LOGO.headerHeightPx;
}

export function BrandLogo({
  variant = 'dark',
  className = '',
  showArabic = true,
  size = 'header',
}: BrandLogoProps) {
  const { locale } = useUiLocale();
  const height = logoHeight(size);
  const width = Math.round(height * BRAND_LOGO.aspectRatio);
  const src = variant === 'light' ? BRAND_LOGO.light : BRAND_LOGO.dark;
  const arabicTone = variant === 'light' ? 'text-stone' : 'text-warm-charcoal';

  return (
    <span
      className={`inline-flex flex-col items-start justify-center leading-none ${className}`.trim()}
    >
      <Image
        src={src}
        alt={BRAND_NAME.latin}
        width={width}
        height={height}
        priority={size === 'header' || size === 'drawer'}
        className="mx-auto block h-auto w-auto max-w-[min(132px,calc(100vw-10.5rem))] object-contain object-center"
        style={{ height, width: 'auto', maxHeight: height }}
      />
      {showArabic ? (
        <span
          lang="ar"
          dir="rtl"
          className={`mt-1 font-body text-[0.75rem] ${arabicTone} ${locale === 'ar' ? 'font-medium' : 'font-normal'}`}
        >
          {BRAND_NAME.arabic}
        </span>
      ) : null}
    </span>
  );
}
