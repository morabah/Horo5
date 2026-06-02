'use client';

import { useUiLocale } from '../../i18n/ui-locale';

export function HoroArtworkPlaceholder({
  label,
  className = '',
}: {
  label?: string;
  className?: string;
}) {
  const { locale } = useUiLocale();
  const isArabic = locale === 'ar';
  const title = label?.trim() || (isArabic ? 'عمل فني قريبًا' : 'Artwork coming soon');
  const subtitle = isArabic ? 'هورو' : 'HORO';

  return (
    <div
      role="img"
      aria-label={title}
      className={[
        'absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#faf7f6] px-3 text-center',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="font-headline text-[11px] font-bold uppercase tracking-[0.22em] text-horo-pulse/75">
        {subtitle}
      </span>
      <span className="font-body max-w-[12rem] text-[12px] leading-snug text-horo-root/55">{title}</span>
    </div>
  );
}
