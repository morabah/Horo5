import { BRAND_NAME } from '../data/brand';
import { useUiLocale } from '../i18n/ui-locale';

type BrandLogoProps = {
  variant?: 'dark' | 'light';
  className?: string;
  showArabic?: boolean;
};

export function BrandLogo({ variant = 'dark', className = '', showArabic = true }: BrandLogoProps) {
  const { locale } = useUiLocale();
  const latinTone = variant === 'light' ? 'text-papyrus' : 'text-obsidian';
  const arabicTone = variant === 'light' ? 'text-stone' : 'text-warm-charcoal';

  return (
    <span
      aria-hidden
      className={`inline-flex flex-col justify-center leading-none ${className}`.trim()}
    >
      <span className={`font-headline text-[1.08rem] font-semibold tracking-[0.28em] ${latinTone}`}>
        {BRAND_NAME.latin}
      </span>
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
