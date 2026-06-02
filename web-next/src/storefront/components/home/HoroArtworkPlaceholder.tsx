'use client';

import { useUiLocale } from '../../i18n/ui-locale';

export function HoroArtworkPlaceholder({
  ariaLabel,
  className = '',
}: {
  /** Screen-reader label only; visible copy stays generic. */
  ariaLabel?: string;
  className?: string;
}) {
  const { locale } = useUiLocale();
  const isArabic = locale === 'ar';
  const brand = isArabic ? 'هورو' : 'HORO';
  const previewCopy = isArabic ? 'معاينة العمل الفني قريبًا' : 'Artwork preview coming soon';
  const accessibleName = ariaLabel?.trim() || `${brand}. ${previewCopy}`;

  return (
    <div
      role="img"
      aria-label={accessibleName}
      className={[
        'absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-[#faf7f6] px-3 text-center',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="font-headline text-[11px] font-bold uppercase tracking-[0.22em] text-horo-pulse/70">
        {brand}
      </span>
      <span className="font-body max-w-[11rem] text-[11px] leading-snug text-horo-root/45">
        {previewCopy}
      </span>
    </div>
  );
}
