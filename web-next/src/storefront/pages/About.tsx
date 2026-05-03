'use client';

import Link from 'next/link';
import { PageBreadcrumb } from '../components/PageBreadcrumb';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { ABOUT_SCHEMA, PDP_SCHEMA } from '../data/domain-config';
import { PAGE_HEROES } from '../content/page-heroes';
import { aboutBridgeAlt, aboutBridgeImage, imgUrl } from '../data/images';
import {  useUiLocale, useDictionary  } from '../i18n/ui-locale';

export function About() {
  useScrollReveal();
  const { locale } = useUiLocale();
  const copy = useDictionary();
  const config = PAGE_HEROES.about;
  const t = (v: { en: string; ar: string } | undefined) =>
    v ? v[locale as 'en' | 'ar'] : undefined;

  return (
    <div className="bg-papyrus pb-16 md:pb-20">
      <div className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-7xl flex-col gap-10 px-4 pt-8 md:gap-12 md:px-8 md:pt-10">
        <PageBreadcrumb
          className="mb-0 md:-mb-2"
          items={[{ label: copy.shell.home, to: '/' }, { label: copy.shell.about }]}
        />
        <section
          aria-label={copy.about.heroRegionLabel}
          className="relative isolate overflow-hidden rounded-[1.75rem] border border-white/65 bg-obsidian shadow-[0_28px_68px_-36px_rgba(26,26,26,0.35)]"
        >
          <div className="grid min-h-[34rem] lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
            <div className="relative min-h-[20rem] lg:min-h-full">
              <img
                src={imgUrl(config.desktopImage?.src ?? '/images/heroes/about-hero.svg', 1600)}
                alt={t(config.desktopImage?.alt) ?? 'HORO brand story'}
                className="absolute inset-0 h-full w-full object-cover object-center"
                width={1600}
                height={1200}
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
              <div
                className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(18,18,18,0.12)_0%,rgba(18,18,18,0.28)_42%,rgba(18,18,18,0.68)_100%)] lg:bg-[linear-gradient(90deg,rgba(18,18,18,0.06)_0%,rgba(18,18,18,0.14)_48%,rgba(18,18,18,0.64)_100%)]"
                aria-hidden
              />
            </div>

            <div className="relative flex items-end lg:items-center">
              <div className="relative z-10 m-4 w-full rounded-[1.35rem] border border-white/65 bg-[linear-gradient(135deg,rgba(26,26,26,0.78),rgba(26,26,26,0.5))] px-5 py-5 shadow-[0_18px_48px_-28px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:m-6 sm:px-6 sm:py-6 md:px-8 md:py-8 lg:m-8">
                <h1 className="font-headline text-[clamp(2.2rem,5vw,4.3rem)] font-semibold leading-[0.94] tracking-tight text-white">{t(config.title) ?? 'Our story'}</h1>
                <div className="mt-5 space-y-6 font-body text-[1.02rem] leading-relaxed text-white/88 md:text-[1.08rem]">
                  <p>
                    HORO was created for people who do not want to disappear into places, routines, or clothes that do not feel like them.
                  </p>
                  <p>
                    We believe what you wear can carry more than style. It can carry a mood, a memory, a thought, or a part of yourself that words do not always reach.
                  </p>
                  <p>
                    Each HORO piece begins as a feeling, then becomes artist-made wearable art. A face, a color, a line, or a symbol is chosen not only for how it looks, but for what it holds. Confidence. Softness. Mystery. Joy. Nostalgia. Rebellion. Calm. A version of yourself still becoming clear.
                  </p>
                  <p>
                    HORO moves with personal rhythm — the rhythm of changing moods, daily rituals, new seasons, and quiet transformations. It is made for the days you feel bold, romantic, strange, peaceful, playful, distant, or impossible to explain.
                  </p>
                  <p>
                    And because feelings are rarely ours alone, every piece can become a signal. A way to find your circle — people who recognize the same mood, even when they wear it differently.
                  </p>
                  <p>
                    We do not design around trends only.
                    We design around feeling, meaning, and the personal rhythm behind what people choose to wear.
                  </p>
                  <p className="text-[1.15rem] text-secondary-fixed md:text-[1.22rem]">
                    Wear What You Feel.
                  </p>
                </div>

                <div className="mt-7 flex flex-col gap-5">
                  {config.primaryCta?.href && t(config.primaryCta.label) ? (
                    <Link
                      href={config.primaryCta.href}
                      className="font-body inline-flex min-h-12 w-full max-w-sm items-center justify-center rounded-sm bg-primary px-8 py-4 text-sm font-medium text-obsidian shadow-xl transition-all duration-300 hover:scale-[1.02] hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal sm:w-auto"
                    >
                      {t(config.primaryCta.label)}
                    </Link>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    {PDP_SCHEMA.trustStripItems.map((item) => (
                      <span
                        key={item}
                        className="font-label inline-flex min-h-11 items-center rounded-full border border-white/45 bg-white/12 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>


        <section
          aria-label={copy.about.bridgeRegionLabel}
          className="relative isolate overflow-hidden rounded-[1.75rem] border border-stone/65 bg-obsidian shadow-[0_28px_68px_-36px_rgba(26,26,26,0.32)]"
        >
          <div className="relative min-h-[20rem] sm:min-h-[24rem]">
            <img
              src={imgUrl(aboutBridgeImage, 1600)}
              alt={aboutBridgeAlt}
              className="absolute inset-0 h-full w-full object-cover object-center"
              width={1600}
              height={1200}
              decoding="async"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(18,18,18,0.24)_0%,rgba(18,18,18,0.36)_42%,rgba(18,18,18,0.82)_100%)]"
              aria-hidden
            />
            <div className="relative z-10 flex min-h-[20rem] items-end justify-center p-5 sm:min-h-[24rem] sm:p-8">
              <Link
                href="/feelings"
                data-reveal="stagger-1"
                className="font-body inline-flex min-h-12 w-full max-w-sm items-center justify-center rounded-sm bg-primary px-8 py-4 text-sm font-medium text-obsidian shadow-xl transition-all duration-300 hover:scale-[1.02] hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal sm:w-auto"
              >
                {copy.about.bridgeCta}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
