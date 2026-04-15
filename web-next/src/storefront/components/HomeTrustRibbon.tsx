import { HOME_TRUST_BADGES } from '../data/homeContent';
import { useUiLocale } from '../i18n/ui-locale';

const AR_TITLES: Record<string, string> = {
  '220 GSM': 'قطن 220 جرام',
  'Licensed art': 'فن مرخّص',
  'Free exchange 14d': 'استبدال مجاني 14 يوم',
  COD: 'الدفع عند الاستلام',
};

export function HomeTrustRibbon() {
  const { locale } = useUiLocale();
  const isArabic = locale === 'ar';

  return (
    <div
      role="list"
      aria-label={isArabic ? 'مزايا الخدمة' : 'Service promises'}
      className="border-y border-obsidian/10 bg-linen"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 py-3 sm:px-6 lg:px-8">
        {HOME_TRUST_BADGES.map((badge, i) => (
          <span
            key={badge.title}
            role="listitem"
            className="font-label inline-flex items-center text-[11px] font-semibold uppercase tracking-[0.18em] text-obsidian"
          >
            <span
              aria-hidden
              className={`mr-3 inline-block h-1 w-1 rounded-full bg-obsidian/40 ${i === 0 ? 'hidden' : ''}`}
            />
            {isArabic ? (AR_TITLES[badge.title] ?? badge.title) : badge.title}
          </span>
        ))}
      </div>
    </div>
  );
}
