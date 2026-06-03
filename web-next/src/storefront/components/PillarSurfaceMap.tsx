'use client';

import { useUiLocale } from '../i18n/ui-locale';

const PILLARS = [
  {
    key: 'artist-studio',
    en: {
      title: "Artist's Studio",
      surfaces: ['PDP artist block', 'Home strip', 'About page'],
    },
    ar: {
      title: 'استوديو الفنان',
      surfaces: ['صفحة الفنان على المنتج', 'شريط الصفحة الرئيسية', 'صفحة عن HORO'],
    },
    accent: '#8C2340',
  },
  {
    key: 'street-gallery',
    en: {
      title: 'Street Gallery',
      surfaces: ['Home hero', 'PLP model shots', 'UGC gallery'],
    },
    ar: {
      title: 'المعرض في الشارع',
      surfaces: ['الصورة الرئيسية', 'صور المنتجات', 'معرض المستخدمين'],
    },
    accent: '#4F111F',
  },
  {
    key: 'the-feel',
    en: {
      title: 'The Feel',
      surfaces: ['Feelings landing', 'Home quiz', 'Relatable quote on PDP'],
    },
    ar: {
      title: 'الإحساس',
      surfaces: ['صفحة المشاعر', 'اختبار الصفحة الرئيسية', 'اقتباس على صفحة المنتج'],
    },
    accent: '#FEE5E2',
  },
  {
    key: 'horo-standard',
    en: {
      title: 'Horo Standard',
      surfaces: ['Size guide', 'Fabric macro', 'Reviews', 'Trust bar'],
    },
    ar: {
      title: 'معيار HORO',
      surfaces: ['دليل المقاسات', 'صور القماش', 'التقييمات', 'شريط الثقة'],
    },
    accent: '#8C2340',
  },
] as const;

export function PillarSurfaceMap() {
  const { locale } = useUiLocale();
  const isArabic = locale === 'ar';

  return (
    <section
      aria-labelledby="pillar-surface-title"
      className="border-t border-stone/20 bg-linen px-4 py-12 sm:px-5 md:py-14 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center md:mb-10" data-reveal>
          <p className="font-label text-[12px] font-semibold uppercase tracking-[0.2em] text-label">
            {isArabic ? 'أربع ركائز' : 'Four pillars'}
          </p>
          <h2
            id="pillar-surface-title"
            className="font-headline mt-2 text-[1.6rem] font-semibold leading-tight tracking-tight text-obsidian md:text-[1.75rem]"
          >
            {isArabic ? 'من وين بتيجي تجربة HORO' : 'Where the HORO experience lives'}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
          {PILLARS.map((pillar, index) => {
            const copy = isArabic ? pillar.ar : pillar.en;
            const reveal = (['stagger-1', 'stagger-2', 'stagger-3', 'stagger-4'] as const)[index];
            return (
              <div
                key={pillar.key}
                data-reveal={reveal}
                className="flex flex-col rounded-[18px] border border-stone/30 bg-white/80 p-5 shadow-sm sm:p-6"
              >
                <div className="mb-3 flex items-center gap-3">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: pillar.accent }}
                    aria-hidden="true"
                  />
                  <h3 className="font-headline text-[1.15rem] font-semibold leading-tight tracking-tight text-obsidian">
                    {copy.title}
                  </h3>
                </div>
                <ul className="space-y-1.5">
                  {copy.surfaces.map((surface) => (
                    <li
                      key={surface}
                      className="font-body text-[15px] leading-relaxed text-warm-charcoal"
                    >
                      {surface}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
