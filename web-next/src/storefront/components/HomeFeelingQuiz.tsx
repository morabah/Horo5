'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  getFeelings,
  productsByFeeling,
  productHasRealImage,
  type Feeling,
} from '../data/site';
import { useUiLocale, useDictionary } from '../i18n/ui-locale';
import { getFeelingCollectionVisual, imgUrl, resolveProductImageSrcForDisplay } from '../data/images';

function getTopFeelings(): Feeling[] {
  return getFeelings()
    .filter((f) => f.active !== false)
    .map((feeling) => {
      const count = productsByFeeling(feeling.slug).filter(productHasRealImage).length;
      return { feeling, count, sortOrder: feeling.sortOrder ?? 999 };
    })
    .filter((entry) => entry.count > 0)
    .sort((a, b) => a.sortOrder - b.sortOrder || b.count - a.count)
    .slice(0, 6)
    .map((entry) => entry.feeling);
}

export function HomeFeelingQuiz() {
  const { locale } = useUiLocale();
  const copy = useDictionary();
  const isArabic = locale === 'ar';
  const feelings = getTopFeelings();
  const [selected, setSelected] = useState<string | null>(null);

  if (feelings.length === 0) return null;

  const selectedFeeling = feelings.find((f) => f.slug === selected);

  return (
    <section
      aria-labelledby="home-feeling-quiz-title"
      className="border-t border-stone/20 bg-papyrus px-4 py-12 sm:px-5 md:py-14 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center md:mb-10" data-reveal>
          <p className="font-label text-[12px] font-semibold uppercase tracking-[0.2em] text-label">
            {isArabic ? 'اكتشف نفسك' : 'Discover your vibe'}
          </p>
          <h2
            id="home-feeling-quiz-title"
            className="font-headline mt-2 text-[1.6rem] font-semibold leading-tight tracking-tight text-obsidian md:text-[1.9rem]"
          >
            {isArabic ? 'إزاي حاسس النهاردة؟' : 'What feeling are you today?'}
          </h2>
        </div>

        {selectedFeeling ? (
          <div className="mx-auto max-w-xl text-center" data-reveal>
            <p className="font-headline text-[1.35rem] font-semibold text-obsidian md:text-[1.6rem]">
              {isArabic ? 'يبدو إنك تحس بـ' : 'Sounds like you feel'}{' '}
              <span className="text-deep-teal">{selectedFeeling.name}</span>
            </p>
            <p className="font-body mt-3 text-[15px] leading-relaxed text-warm-charcoal">
              {selectedFeeling.tagline || selectedFeeling.blurb || ''}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href={`/feelings/${selectedFeeling.slug}`}
                className="font-body inline-flex min-h-12 items-center justify-center rounded-md bg-obsidian px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-deep-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
              >
                {isArabic
                  ? `تصفّح ${selectedFeeling.name}`
                  : `Browse ${selectedFeeling.name}`}
              </Link>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="font-body inline-flex min-h-12 items-center justify-center rounded-md border border-obsidian/30 px-6 py-3 text-sm font-medium text-obsidian transition-colors hover:border-obsidian hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
              >
                {isArabic ? 'جرّب تاني' : 'Try another'}
              </button>
            </div>
          </div>
        ) : (
          <div
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6"
            role="radiogroup"
            aria-label={isArabic ? 'اختر شعورك' : 'Pick your feeling'}
          >
            {feelings.map((feeling, index) => {
              const visuals = getFeelingCollectionVisual(feeling.slug);
              const src = visuals.cover.src || visuals.hero.src;
              const reveal = (['stagger-1', 'stagger-2', 'stagger-3', 'stagger-4', 'stagger-5', 'stagger-6'] as const)[index];

              return (
                <button
                  key={feeling.slug}
                  type="button"
                  role="radio"
                  aria-checked={selected === feeling.slug}
                  onClick={() => setSelected(feeling.slug)}
                  data-reveal={reveal}
                  className="group relative isolate flex aspect-[1/1.15] flex-col items-center justify-end overflow-hidden rounded-[18px] bg-obsidian p-4 text-center text-white shadow-sm transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal sm:p-5"
                >
                  {src ? (
                    <img
                      src={imgUrl(resolveProductImageSrcForDisplay(src), 600)}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 h-full w-full object-cover opacity-60 transition-opacity duration-300 group-hover:opacity-75"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : null}
                  <span className="absolute inset-0 bg-linear-to-t from-obsidian/80 via-obsidian/30 to-transparent" aria-hidden="true" />
                  <span className="font-headline relative z-10 text-[1.1rem] font-semibold leading-tight tracking-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)] sm:text-[1.25rem]">
                    {feeling.name}
                  </span>
                  {feeling.tagline ? (
                    <span className="font-label relative z-10 mt-1 line-clamp-1 text-[10px] font-medium uppercase tracking-[0.14em] text-white/80">
                      {feeling.tagline}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
