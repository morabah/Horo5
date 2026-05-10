'use client';

import Link from 'next/link';
import { useMemo } from 'react';

import { MerchProductCard } from '../components/MerchProductCard';
import { getProductCardImageSrc } from '../data/images';
import { useUiLocale } from '../i18n/ui-locale';
import type { Product, MerchEvent } from '../data/site';
import { WaitlistForm } from '../components/WaitlistForm';

export type CampaignPageProps = {
  event: MerchEvent;
  products: Product[];
  preLaunchPhase?: string;
};

export function CampaignPage({ event, products, preLaunchPhase }: CampaignPageProps) {
  const { locale } = useUiLocale();
  const isArabic = locale === 'ar';
  const isRevealMode = preLaunchPhase === 'reveal';

  const productCards = useMemo(() => {
    return products.map((product) => {
      const imageSrc = getProductCardImageSrc(product);
      return (
        <MerchProductCard
          key={product.slug}
          slug={product.slug}
          name={product.name}
          priceEgp={product.priceEgp}
          imageSrc={imageSrc}
          imageAlt={product.name}
          artistCredit={product.artistDisplay?.name}
          onQuickView={() => {}}
          eager={false}
        />
      );
    });
  }, [products]);

  return (
    <div className="bg-papyrus text-obsidian">
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        {event.heroImageSrc ? (
          <img
            src={event.heroImageSrc}
            alt={event.heroImageAlt || event.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,10,8,0.55)_0%,rgba(9,10,8,0.35)_40%,rgba(9,10,8,0.65)_100%)]"
        />
        <div className="relative z-10 mx-auto max-w-[1320px] px-4 py-24 md:px-12 md:py-32">
          <div className="max-w-2xl">
            <p className="font-label text-[11px] font-medium uppercase tracking-[0.24em] text-[#f5f0e6]/80">
              {isArabic ? 'مجموعة HORO' : 'HORO Collection'}
            </p>
            <h1 className="font-headline mt-4 text-[clamp(2.2rem,6.5vw,4.5rem)] font-semibold leading-[1.05] tracking-tight text-[#f5f0e6]">
              {event.name}
            </h1>
            {event.teaser ? (
              <p className="font-body mt-4 max-w-lg text-[clamp(1rem,1.6vw,1.25rem)] leading-relaxed text-[#f5f0e6]/90">
                {event.teaser}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {/* Story body */}
      {event.body ? (
        <section className="mx-auto max-w-[720px] px-4 py-14 md:px-12 md:py-20">
          <div className="font-body text-[15px] leading-[1.75] text-warm-charcoal whitespace-pre-line">
            {event.body}
          </div>
        </section>
      ) : null}

      {/* Product grid */}
      {products.length > 0 ? (
        <section className="border-t border-stone/25">
          <div className="mx-auto max-w-[1320px] px-4 py-14 md:px-12 md:py-20">
            <h2 className="font-headline text-[clamp(1.5rem,3vw,2.2rem)] font-semibold leading-tight text-obsidian">
              {isArabic ? 'القطع في هذه المجموعة' : 'Pieces in this drop'}
            </h2>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {productCards}
            </div>
          </div>
        </section>
      ) : null}

      {/* Reveal-mode waitlist CTA */}
      {isRevealMode ? (
        <section className="border-t border-stone/25 bg-[#2a2d26]">
          <div className="mx-auto max-w-[1320px] px-4 py-14 md:px-12 md:py-20">
            <div className="mx-auto max-w-xl text-center">
              <h2 className="font-headline text-[clamp(1.5rem,3vw,2.2rem)] font-semibold leading-tight text-[#f5f0e6]">
                {isArabic ? 'كن أول من يعرف' : 'Be the first to know'}
              </h2>
              <p className="font-body mt-3 text-[15px] leading-relaxed text-[#f5f0e6]/80">
                {isArabic
                  ? 'سجّل بريدك للحصول على إشعار فور طرح هذه المجموعة.'
                  : 'Enter your email to get notified the moment this collection drops.'}
              </p>
              <div className="mt-6 flex justify-center">
                <WaitlistForm source={`campaign_${event.slug}`} />
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Back link */}
      <div className="mx-auto max-w-[1320px] px-4 py-8 md:px-12">
        <Link
          href="/"
          className="font-label inline-flex min-h-11 items-center text-[11px] font-medium uppercase tracking-[0.18em] text-deep-teal underline decoration-deep-teal/35 underline-offset-4 transition-colors hover:text-obsidian"
        >
          {isArabic ? 'العودة إلى الرئيسية' : 'Back to home'}
        </Link>
      </div>
    </div>
  );
}
