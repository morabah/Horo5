import { HOME_TRUST_BADGES } from '../data/homeContent';
import { useUiLocale } from '../i18n/ui-locale';

export function HomeTrustRibbon() {
  const { copy, locale } = useUiLocale();
  const isArabic = locale === 'ar';

  return (
    <div
      role="list"
      aria-label={isArabic ? 'مزايا الخدمة' : 'Service promises'}
      className="border-y border-obsidian/10 bg-linen"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 py-3 sm:gap-x-8 sm:px-6 lg:px-8">
        {HOME_TRUST_BADGES.map((badge, i) => (
          <span
            key={badge.key}
            role="listitem"
            className="font-label inline-flex items-center text-[11px] font-semibold uppercase tracking-[0.18em] text-obsidian"
          >
            <span
              aria-hidden
              className={`mr-3 inline-block h-1 w-1 rounded-full bg-obsidian/40 ${i === 0 ? 'hidden' : ''}`}
            />
            {copy.home.trustBadges[badge.key]}
          </span>
        ))}
      </div>
    </div>
  );
}
