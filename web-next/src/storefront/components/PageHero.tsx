"use client";

import Image from "next/image";
import { Link } from "react-router-dom";

import type { PageHeroConfig } from "../content/page-heroes";

type PageHeroProps = {
  config: PageHeroConfig;
  locale: "en" | "ar";
  /** When true, reduces hero height so the page content remains close. */
  compact?: boolean;
  /** Override the heading tag (default h1). */
  headingTag?: "h1" | "h2";
};

const FOCAL_POINT_MAP: Record<string, string> = {
  center: "object-center",
  top: "object-top",
  bottom: "object-bottom",
  left: "object-left",
  right: "object-right",
};

const THEME_SURFACE: Record<NonNullable<PageHeroConfig["theme"]>, string> = {
  dark: "bg-obsidian",
  light: "bg-papyrus",
  beige: "bg-papyrus",
};

const THEME_TEXT: Record<NonNullable<PageHeroConfig["theme"]>, string> = {
  dark: "text-white",
  light: "text-obsidian",
  beige: "text-obsidian",
};

const THEME_EYEBROW: Record<NonNullable<PageHeroConfig["theme"]>, string> = {
  dark: "text-white/70",
  light: "text-warm-charcoal",
  beige: "text-warm-charcoal",
};

const THEME_CTA_PRIMARY: Record<NonNullable<PageHeroConfig["theme"]>, string> = {
  dark: "bg-papyrus text-obsidian hover:bg-white",
  light: "bg-obsidian text-white hover:bg-obsidian/90",
  beige: "bg-obsidian text-white hover:bg-obsidian/90",
};

const THEME_CTA_SECONDARY: Record<NonNullable<PageHeroConfig["theme"]>, string> = {
  dark:
    "border border-papyrus/40 bg-black/20 text-papyrus hover:border-papyrus/75 hover:bg-black/28",
  light:
    "border border-obsidian/30 bg-white/60 text-obsidian hover:border-obsidian/60 hover:bg-white/80",
  beige:
    "border border-obsidian/30 bg-white/60 text-obsidian hover:border-obsidian/60 hover:bg-white/80",
};

export function PageHero({
  config,
  locale,
  compact = false,
  headingTag: H = "h1",
}: PageHeroProps) {
  const t = (v: { en: string; ar: string } | undefined) => (v ? v[locale] : undefined);

  const eyebrow = t(config.eyebrow);
  const title = t(config.title);
  const subtitle = t(config.subtitle);
  const primaryLabel = t(config.primaryCta?.label);
  const primaryHref = config.primaryCta?.href?.trim();
  const secondaryLabel = t(config.secondaryCta?.label);
  const secondaryHref = config.secondaryCta?.href?.trim();

  const hasPrimary = Boolean(primaryLabel && primaryHref);
  const hasSecondary = Boolean(secondaryLabel && secondaryHref);
  const hasCtas = hasPrimary || hasSecondary;

  const desktopSrc = config.desktopImage?.src?.trim();
  const mobileSrc = config.mobileImage?.src?.trim();
  const hasDesktopImage = Boolean(desktopSrc);
  const hasMobileImage = Boolean(mobileSrc && mobileSrc !== desktopSrc);

  const focalClass = FOCAL_POINT_MAP[config.focalPoint ?? "center"] ?? "object-center";
  const theme = config.theme ?? "dark";
  const textClass = THEME_TEXT[theme];
  const eyebrowClass = THEME_EYEBROW[theme];
  const surfaceBg = THEME_SURFACE[theme];
  const headingId = `${config.pageKey}-page-hero-heading`;

  const heightClass = compact
    ? "min-h-[18rem] sm:min-h-[22rem] md:min-h-[26rem]"
    : "min-h-[70dvh] md:min-h-[60dvh]";

  return (
    <section
      aria-labelledby={headingId}
      className={`relative isolate overflow-hidden ${surfaceBg} ${textClass}`}
    >
      {hasDesktopImage ? (
        <div className="absolute inset-0 z-0" aria-hidden={!t(config.desktopImage?.alt)}>
          {hasMobileImage ? (
            <Image
              src={mobileSrc!}
              alt={t(config.mobileImage?.alt) ?? t(config.desktopImage?.alt) ?? ""}
              fill
              priority
              className={`block object-cover md:hidden ${focalClass}`}
              sizes="100vw"
            />
          ) : null}
          <Image
            src={desktopSrc!}
            alt={t(config.desktopImage?.alt) ?? ""}
            fill
            priority
            className={`${hasMobileImage ? "hidden md:block" : "block"} object-cover ${focalClass}`}
            sizes="100vw"
          />
        </div>
      ) : (
        <div className="absolute inset-0 z-0 bg-papyrus" aria-hidden />
      )}

      {/* Scrim overlay for readability */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgba(9,10,8,0.35)_0%,rgba(9,10,8,0.2)_35%,rgba(9,10,8,0.45)_100%)]"
        aria-hidden
      />

      <div
        className={`relative z-10 mx-auto flex w-full max-w-[1440px] flex-col justify-end px-[max(1rem,env(safe-area-inset-left,0px))] pb-[max(2.25rem,calc(env(safe-area-inset-bottom,0px)+1.25rem))] pr-[max(1rem,env(safe-area-inset-right,0px))] pt-[max(5rem,calc(env(safe-area-inset-top,0px)+4.25rem))] sm:px-6 sm:pb-[max(2rem,calc(env(safe-area-inset-bottom,0px)+1rem))] sm:pt-32 md:px-8 lg:px-10 ${heightClass}`}
      >
        <div className="max-w-[min(56ch,48vw)]">
          {eyebrow ? (
            <p
              className={`font-label mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] ${eyebrowClass}`}
            >
              {eyebrow}
            </p>
          ) : null}

          <H
            id={headingId}
            className="font-headline text-[clamp(2rem,5vw,3.6rem)] font-semibold leading-[0.98] tracking-tight"
          >
            {title}
          </H>

          {subtitle ? (
            <p className="font-body mt-4 text-[clamp(1rem,1.5vw,1.25rem)] leading-relaxed opacity-90">
              {subtitle}
            </p>
          ) : null}

          {hasCtas ? (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {hasPrimary ? (
                <Link
                  to={primaryHref!}
                  className={`font-body inline-flex min-h-12 items-center justify-center rounded-md px-7 py-3 text-[14px] font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal ${THEME_CTA_PRIMARY[theme]}`}
                >
                  {primaryLabel}
                </Link>
              ) : null}
              {hasSecondary ? (
                <Link
                  to={secondaryHref!}
                  className={`font-body inline-flex min-h-12 items-center justify-center rounded-md px-7 py-3 text-[14px] font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal ${THEME_CTA_SECONDARY[theme]}`}
                >
                  {secondaryLabel}
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
