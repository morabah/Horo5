'use client';
import { DICTIONARY } from "@/storefront/i18n/dictionary";

import Link from 'next/link';
import { useEffect } from 'react';
import { PageBreadcrumb } from '../components/PageBreadcrumb';
import { RecentlyViewedStrip } from '../components/RecentlyViewedStrip';
import { VibeCommerceCard } from '../components/VibeCommerceCard';
import { VIBES_SCHEMA } from '../data/domain-config';
import { PAGE_HEROES } from '../content/page-heroes';
import {  useUiLocale, useDictionary  } from '../i18n/ui-locale';
import {
  getFeelings,
  setRuntimeCatalog,
  type Feeling,
  type RuntimeCatalog,
} from '../data/site';
import { trackFeelingsHubView } from '../analytics/funnel';

type ShopByFeelingProps = {
  /** Server catalog from Medusa, matching the homepage first-paint data flow. */
  initialCatalog?: Partial<RuntimeCatalog> | null;
};

function sortActiveFeelings(feelings: Feeling[]) {
  return feelings
    .filter((feeling) => feeling.active !== false)
    .map((feeling, index) => ({ feeling, index }))
    .sort(
      (left, right) =>
        (left.feeling.sortOrder ?? left.index) - (right.feeling.sortOrder ?? right.index) ||
        left.index - right.index,
    )
    .slice(0, 8)
    .map((entry) => entry.feeling);
}

export function ShopByFeeling({ initialCatalog }: ShopByFeelingProps = {}) {
  if (initialCatalog) {
    setRuntimeCatalog(initialCatalog);
  }

  const { locale } = useUiLocale();
  const copy = useDictionary();
  const isArabic = locale === 'ar';
  const feelings = sortActiveFeelings(getFeelings());

  useEffect(() => {
    if (feelings.length > 0) trackFeelingsHubView(feelings.length);
  }, [feelings.length]);

  if (feelings.length === 0) {
    return (
      <div className="bg-papyrus pb-16 md:pb-20">
        <div className="mx-auto max-w-7xl px-4 pt-8 md:px-8 md:pt-10">
          <PageBreadcrumb
            className="mb-6"
            items={[
              { label: copy.shell.home, to: '/' },
              { label: copy.shell.shopByFeeling },
            ]}
          />
          <p className="font-body text-warm-charcoal">Feeling collections are not available yet. Try again shortly.</p>
          <Link className="btn btn-primary mt-6 inline-flex" href="/">
            {copy.shell.home}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-papyrus pb-16 md:pb-20">
      <div className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-7xl flex-col gap-10 px-4 pt-8 md:gap-12 md:px-8 md:pt-10">
        <PageBreadcrumb
          className="mb-0 md:-mb-2"
          items={[
            { label: copy.shell.home, to: '/' },
            { label: copy.shell.shopByFeeling },
          ]}
        />
        <section
          className="relative isolate overflow-hidden"
          aria-label={PAGE_HEROES.feelings.eyebrow?.[locale as 'en' | 'ar'] ?? DICTIONARY.en.vibes.hubHeroAlt}
        >
          <div className="relative min-h-[26rem] w-full bg-obsidian sm:min-h-[30rem] lg:min-h-[34rem]">
            {PAGE_HEROES.feelings.desktopImage?.src && (
              <img
                src={PAGE_HEROES.feelings.desktopImage.src}
                alt={PAGE_HEROES.feelings.desktopImage.alt[locale as 'en' | 'ar'] ?? DICTIONARY.en.vibes.hubHeroAlt}
                className="absolute inset-0 h-full w-full object-cover"
                style={{ objectPosition: PAGE_HEROES.feelings.focalPoint || 'center' }}
                width={1600}
                height={900}
                decoding="async"
              />
            )}
          </div>
          {/* Minimal vignette — photos are the hero */}
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.2)_100%)]"
            aria-hidden
          />

          {/* Bottom glass bar — headline only */}
          <div className="absolute inset-x-0 bottom-0">
            <div className="feelings-hub-glass-bar flex items-center justify-center px-4 py-5 sm:py-6">
              <h1 className="text-center font-headline text-[clamp(1.5rem,5vw,2.5rem)] font-semibold leading-tight tracking-tight text-white">
                {PAGE_HEROES.feelings.title[locale as 'en' | 'ar'] ?? DICTIONARY.en.vibes.hubTitle}
              </h1>
            </div>
          </div>

          {/* Shop All pill — top left */}
          <div className="absolute left-4 top-4 sm:left-6 sm:top-6 md:left-8 md:top-8">
            {PAGE_HEROES.feelings.primaryCta?.href && PAGE_HEROES.feelings.primaryCta.label[locale as 'en' | 'ar'] ? (
              <Link
                href={PAGE_HEROES.feelings.primaryCta.href}
                className="feelings-hub-glass-pill font-label inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full px-4 py-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-white transition-all hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:text-[10px]"
              >
                {PAGE_HEROES.feelings.primaryCta.label[locale as 'en' | 'ar']}
                <span className="text-white/50" aria-hidden>→</span>
              </Link>
            ) : (
              <Link
                href="/products"
                className="feelings-hub-glass-pill font-label inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full px-4 py-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-white transition-all hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:text-[10px]"
              >
                {copy.shell.shopAll}
                <span className="text-white/50" aria-hidden>→</span>
              </Link>
            )}
          </div>
        </section>

        <section aria-labelledby="feelings-grid-title" className="bg-papyrus px-4 pb-16 pt-10 sm:px-6 md:px-8 md:pb-20 md:pt-12">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="font-label text-[10px] font-medium uppercase tracking-[0.22em] text-label">{copy.vibes.hubGridEyebrow}</p>
                <h2
                  id="feelings-grid-title"
                  className="font-headline mt-2 text-[1.35rem] font-semibold tracking-tight text-obsidian md:text-[1.6rem]"
                >
                  {copy.vibes.hubGridTitle}
                </h2>
              </div>
              <Link
                href="/products"
                className="font-label inline-flex min-h-11 items-center text-[11px] font-semibold uppercase tracking-[0.18em] text-deep-teal transition-colors hover:text-obsidian"
              >
                {copy.shell.shopAll}
              </Link>
            </div>
            <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-7 xl:grid-cols-4">
              {feelings.map((feeling) => (
                <VibeCommerceCard
                  key={feeling.slug}
                  feeling={feeling}
                  titleTag="h3"
                  variant="explore"
                  className="h-full min-h-[23rem] sm:min-h-[25rem]"
                />
              ))}
            </div>
          </div>
        </section>
      </div>

      <RecentlyViewedStrip className="border-t border-stone/20" />
    </div>
  );
}
