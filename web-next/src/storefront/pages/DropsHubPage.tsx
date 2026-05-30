'use client';

import Link from 'next/link';

import { PageBreadcrumb } from '../components/PageBreadcrumb';
import type { MerchEvent } from '../data/site';
import { useUiLocale } from '../i18n/ui-locale';

type DropsHubPageProps = {
  events: MerchEvent[];
};

export function DropsHubPage({ events }: DropsHubPageProps) {
  const { locale } = useUiLocale();
  const isArabic = locale === 'ar';
  const active = events.filter((event) => event.active !== false);

  return (
    <main className="bg-papyrus px-4 pb-20 pt-10 md:px-8 md:pt-14">
      <div className="mx-auto max-w-4xl">
        <PageBreadcrumb
          className="mb-8"
          items={[
            { label: isArabic ? 'الرئيسية' : 'Home', to: '/' },
            { label: isArabic ? 'إصدارات جديدة' : 'New drops' },
          ]}
        />

        <h1 className="font-headline text-3xl font-semibold tracking-tight text-obsidian md:text-4xl">
          {isArabic ? 'إصدارات HORO' : 'HORO drops'}
        </h1>
        <p className="mt-4 font-body text-[15px] leading-relaxed text-warm-charcoal">
          {isArabic
            ? 'مجموعات محدودة من قطع الفنانين — كل إصدار له قصة وإثبات قبل الطلب.'
            : 'Limited artist-made releases — each drop has a story and proof before you order.'}
        </p>

        {active.length === 0 ? (
          <p className="mt-10 rounded-2xl border border-stone/35 bg-white/70 p-6 font-body text-sm text-clay">
            {isArabic
              ? 'لا يوجد إصدار نشط الآن. تابعنا على واتساب أو عد لاحقاً.'
              : 'No active drop right now. Check back soon or message us on WhatsApp.'}
          </p>
        ) : (
          <ul className="mt-10 space-y-4">
            {active.map((event) => (
              <li key={event.slug}>
                <Link
                  href={`/campaigns/${event.slug}`}
                  className="block rounded-2xl border border-stone/35 bg-white/80 p-6 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                >
                  <p className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-label">
                    {isArabic ? 'إصدار' : 'Drop'}
                  </p>
                  <h2 className="mt-2 font-headline text-xl font-semibold text-obsidian">{event.name}</h2>
                  {event.teaser ? (
                    <p className="mt-2 font-body text-sm leading-relaxed text-warm-charcoal">{event.teaser}</p>
                  ) : null}
                  <span className="mt-4 inline-flex font-label text-[10px] font-semibold uppercase tracking-[0.18em] text-deep-teal">
                    {isArabic ? 'استكشف ←' : 'Explore →'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-10">
          <Link href="/products" className="btn btn-secondary min-h-11">
            {isArabic ? 'تسوق كل التصاميم' : 'Shop all designs'}
          </Link>
        </p>
      </div>
    </main>
  );
}
