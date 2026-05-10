'use client';

import Link from 'next/link';
import { useUiLocale } from '../i18n/ui-locale';

const COHORTS = [
  {
    slug: 'explorer',
    en: { title: 'The Explorer', tagline: 'For the one who chases new cities and new feelings.' },
    ar: { title: 'المكتشف', tagline: 'للشخص اللي بيدور على مدن جديدة ومشاعر جديدة.' },
    accent: '#B77A67',
  },
  {
    slug: 'curator',
    en: { title: 'The Curator', tagline: 'For the one who notices details others miss.' },
    ar: { title: 'القائم', tagline: 'للشخص اللي بيلاحظ التفاصيل اللي الناس بتفوتها.' },
    accent: '#556F73',
  },
  {
    slug: 'connoisseur',
    en: { title: 'The Connoisseur', tagline: 'For the one who already has taste — and wants more.' },
    ar: { title: 'الخبير', tagline: 'للشخص اللي عنده ذوق — وعايز يزوده.' },
    accent: '#D4A44E',
  },
] as const;

export function GiftCohortCards() {
  const { locale } = useUiLocale();
  const isArabic = locale === 'ar';

  return (
    <section
      aria-labelledby="gift-cohorts-title"
      className="border-t border-stone/20 bg-papyrus px-4 py-12 sm:px-5 md:py-14 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center md:mb-10" data-reveal>
          <p className="font-label text-[12px] font-semibold uppercase tracking-[0.2em] text-label">
            {isArabic ? 'هدية لكل شخصية' : 'A gift for every personality'}
          </p>
          <h2
            id="gift-cohorts-title"
            className="font-headline mt-2 text-[1.6rem] font-semibold leading-tight tracking-tight text-obsidian md:text-[1.75rem]"
          >
            {isArabic ? 'مين الشخص اللي في بالك؟' : 'Who is on your mind?'}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
          {COHORTS.map((cohort, index) => {
            const copy = isArabic ? cohort.ar : cohort.en;
            const reveal = (['stagger-1', 'stagger-2', 'stagger-3'] as const)[index];
            return (
              <Link
                key={cohort.slug}
                href="/gifts"
                data-reveal={reveal}
                className="group flex flex-col rounded-[18px] border border-stone/40 bg-white/80 p-6 shadow-[0_18px_44px_-30px_rgba(26,26,26,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:border-stone/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
              >
                <span
                  className="mb-4 inline-block h-2 w-8 rounded-full"
                  style={{ backgroundColor: cohort.accent }}
                  aria-hidden="true"
                />
                <h3 className="font-headline text-[1.25rem] font-semibold leading-tight tracking-tight text-obsidian">
                  {copy.title}
                </h3>
                <p className="font-body mt-2 text-[15px] leading-relaxed text-warm-charcoal">
                  {copy.tagline}
                </p>
                <span className="font-label mt-4 inline-flex min-h-11 items-center text-[11px] font-medium uppercase tracking-[0.18em] text-deep-teal transition-colors group-hover:text-obsidian">
                  {isArabic ? 'اكتشف الهدايا →' : 'Explore gifts →'}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
