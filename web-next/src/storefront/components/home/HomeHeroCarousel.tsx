'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { trackHeroCtaClick } from '../../analytics/events';
import { HomeImageCampaign } from './HomeImageCampaign';
import type { HomepagePresentation } from '../../lib/parseHomepagePresentation';

export type HeroCarouselSlide = {
  key: string;
  title: string;
  body?: string;
  imageSrc: string;
  imageAlt: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  presentation?: HomepagePresentation;
};

type HomeHeroCarouselProps = {
  slides: HeroCarouselSlide[];
  autoAdvance?: boolean;
  autoAdvanceMs?: number;
  sectionClassName?: string;
  minHeight?: string;
  priority?: boolean;
};

export function HomeHeroCarousel({
  slides,
  autoAdvance = false,
  autoAdvanceMs = 8000,
  sectionClassName = '',
  minHeight = 'min-h-[min(72vh,52rem)]',
  priority = true,
}: HomeHeroCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setPrefersReducedMotion(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  const visibleSlides = useMemo(
    () => (prefersReducedMotion ? slides.slice(0, 1) : slides),
    [prefersReducedMotion, slides],
  );

  const goTo = useCallback(
    (index: number) => {
      if (visibleSlides.length <= 1) return;
      setActiveIndex((index + visibleSlides.length) % visibleSlides.length);
    },
    [visibleSlides.length],
  );

  useEffect(() => {
    if (!autoAdvance || prefersReducedMotion || visibleSlides.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % visibleSlides.length);
    }, autoAdvanceMs);
    return () => window.clearInterval(timer);
  }, [autoAdvance, autoAdvanceMs, prefersReducedMotion, visibleSlides.length]);

  const slide = visibleSlides[activeIndex] ?? visibleSlides[0];
  if (!slide) return null;

  return (
    <div className={`home-hero-carousel relative ${sectionClassName}`.trim()}>
      <HomeImageCampaign
        id={`home-hero-slide-${slide.key}`}
        titleAs="h1"
        titleId="home-hero-heading"
        title={slide.title}
        body={slide.body}
        imageSrc={slide.imageSrc}
        imageAlt={slide.imageAlt}
        primaryCta={slide.primaryCta}
        secondaryCta={slide.secondaryCta}
        presentation={{
          layout: 'image_overlay',
          showEyebrow: false,
          overlayOpacity: slide.presentation?.overlayOpacity ?? 0.5,
          fullBleed: slide.presentation?.fullBleed !== false,
          showSecondaryCta: Boolean(slide.secondaryCta),
          textPlacement: slide.presentation?.textPlacement ?? 'bottom-left',
        }}
        sectionClassName="home-hero__campaign--full-bleed"
        priority={priority && activeIndex === 0}
        minHeight={minHeight}
        onPrimaryClick={() =>
          trackHeroCtaClick(slide.primaryCta.label, slide.primaryCta.href, slide.key)
        }
        onSecondaryClick={() => {
          if (!slide.secondaryCta) return;
          trackHeroCtaClick(slide.secondaryCta.label, slide.secondaryCta.href, slide.key);
        }}
      />

      {visibleSlides.length > 1 ? (
        <div
          className="home-hero-carousel__dots absolute inset-x-0 bottom-4 z-10 flex justify-center gap-2 px-4 md:bottom-6"
          role="tablist"
          aria-label="Hero slides"
        >
          {visibleSlides.map((item, index) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-controls={`home-hero-slide-${item.key}`}
              className={`h-2.5 w-2.5 rounded-full border border-white/80 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                index === activeIndex ? 'bg-white' : 'bg-white/35 hover:bg-white/60'
              }`}
              onClick={() => goTo(index)}
            >
              <span className="sr-only">{item.title}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
