'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { trackCloserLookClick, trackHeroCtaClick } from '../../analytics/events';
import { homeHeroShirtAnimation } from '../../data/images';

const HERO_BLUR_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAFklEQVR4nGMQERP6TwxmGFUoQtfgAQAHCnsNFNbySQAAAABJRU5ErkJggg==';

export const HERO_BOTTOM_SENTINEL_ID = 'home-hero-bottom-sentinel';

export type HomeHeroCinematicProps = {
  title: React.ReactNode;
  promiseLine: string;
  primaryCtaLabel: string;
  primaryHref: string;
  secondaryCtaLabel: string;
  secondaryHref: string;
  heroVariant: string;
  scrollCueLabel: string;
  posterAlt: string;
};

/** Split “Wear What You Feel” across two lines like the homepage mockup. */
export function HeroTitleDisplay({ title }: { title: string }) {
  const normalized = title.replace(/\s+/g, ' ').trim();
  const match = normalized.match(/^(wear what)\s+(you feels?)$/i);
  if (match) {
    return (
      <>
        <span className="block">Wear What </span>
        <span className="block">You Feel</span>
      </>
    );
  }
  return normalized;
}

export function HomeHeroCinematic({
  title,
  promiseLine,
  primaryCtaLabel,
  primaryHref,
  secondaryCtaLabel,
  secondaryHref,
  heroVariant,
  scrollCueLabel,
  posterAlt,
}: HomeHeroCinematicProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoPlaying, setVideoPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    video.src = homeHeroShirtAnimation.src;
    video.load();
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay may be blocked; poster remains visible.
      });
    }
  }, []);

  const titleNode =
    typeof title === 'string' ? <HeroTitleDisplay title={title} /> : title;

  return (
    <section
      id="home-hero"
      aria-labelledby="home-hero-heading"
      data-hero-layout="cinematic"
      data-hero-variant={heroVariant}
      className="home-hero--cinematic hero-bleed relative isolate min-h-[min(80vh,48rem)] overflow-hidden bg-obsidian text-white sm:min-h-[min(88vh,56rem)]"
    >
      <div className="hero-bleed-fallback absolute inset-0 z-0" aria-hidden />

      <Image
        src={homeHeroShirtAnimation.posterSrc}
        alt={posterAlt}
        fill
        priority
        fetchPriority="high"
        sizes="100vw"
        placeholder="blur"
        blurDataURL={HERO_BLUR_DATA_URL}
        className="home-hero--cinematic__poster hero-bleed-img absolute inset-0 z-1 h-full w-full object-cover"
      />

      <video
        ref={videoRef}
        className={`home-hero--cinematic__video hero-bleed-img absolute inset-0 z-1 h-full w-full object-cover transition-opacity duration-700 ${videoPlaying ? 'opacity-100' : 'opacity-0'}`}
        muted
        loop
        playsInline
        preload="none"
        aria-hidden
        onPlaying={() => setVideoPlaying(true)}
      />

      <div className="hero-bleed-scrim-base home-hero--cinematic__scrim pointer-events-none absolute inset-0 z-2" aria-hidden />
      <div className="hero-bleed-scrim-read pointer-events-none absolute inset-0 z-4" aria-hidden />
      <div className="hero-bleed-grain pointer-events-none absolute inset-0 z-5" aria-hidden />

      <div className="home-hero--cinematic__inner hero-bleed-inner relative z-20 mx-auto flex min-h-[min(80vh,48rem)] w-full max-w-[1440px] flex-col justify-end px-[max(1rem,env(safe-area-inset-left,0px))] pb-[max(1.5rem,calc(env(safe-area-inset-bottom,0px)+0.75rem))] pr-[max(1rem,env(safe-area-inset-right,0px))] pt-28 sm:min-h-[min(88vh,56rem)] sm:px-6 sm:pb-[max(2rem,calc(env(safe-area-inset-bottom,0px)+1rem))] sm:pt-32 md:px-8 lg:px-10">
        <div className="home-hero--cinematic__copy hero-bleed-copy max-w-none items-start text-start">
          <h1 id="home-hero-heading" className="home-hero--cinematic__title hero-bleed-title font-headline text-start">
            {titleNode}
          </h1>
          {promiseLine ? (
            <p className="home-hero--cinematic__subtitle mt-3 max-w-[32rem] font-body text-[15px] leading-relaxed text-white/88 sm:mt-4 sm:text-base">
              {promiseLine}
            </p>
          ) : null}
          <div className="home-hero--cinematic__actions hero-bleed-actions mt-5 flex w-full flex-wrap justify-start gap-3 sm:mt-6">
            <Link
              href={primaryHref}
              onClick={() => trackHeroCtaClick(primaryCtaLabel, primaryHref, heroVariant)}
              className="home-btn home-btn--primary font-body inline-flex min-h-11 items-center justify-center rounded-[4px] bg-horo-pulse px-5 py-2.5 text-[12px] font-bold text-white transition-[transform,background-color] hover:bg-horo-root focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {primaryCtaLabel}
            </Link>
            <Link
              href={secondaryHref}
              onClick={() => {
                trackHeroCtaClick(secondaryCtaLabel, secondaryHref, heroVariant);
                if (secondaryHref.includes('editorial')) {
                  trackCloserLookClick('hero', secondaryHref);
                }
              }}
              className="home-btn home-btn--secondary font-body inline-flex min-h-11 items-center justify-center rounded-[4px] border border-white/50 bg-white/8 px-5 py-2.5 text-[12px] font-bold text-white backdrop-blur-[2px] transition-[transform,background-color,color] hover:bg-white/14 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {secondaryCtaLabel}
            </Link>
          </div>
        </div>

        <Link
          href="#founding-drop"
          className="home-hero--cinematic__scroll-cue mt-4 inline-flex min-h-11 items-center gap-1.5 self-center font-body text-[11px] font-semibold uppercase tracking-[0.14em] text-white/72 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:absolute sm:bottom-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)+0.5rem))] sm:left-1/2 sm:mt-0 sm:-translate-x-1/2"
        >
          <span>{scrollCueLabel}</span>
          <span aria-hidden className="home-hero--cinematic__scroll-icon">
            ↓
          </span>
        </Link>
      </div>

      <div className="hero-bleed-vignette pointer-events-none absolute inset-0 z-14" aria-hidden />
      <div id={HERO_BOTTOM_SENTINEL_ID} aria-hidden="true" className="absolute bottom-0 left-0 h-px w-full" />
    </section>
  );
}
