import type { CSSProperties, ReactNode } from 'react';

type VibeAnimatedArtProps = {
  slug: string;
  accent: string;
};

/**
 * Decorative animated SVG per vibe — editorial header (replaces Material icons).
 * Motion: CSS in index.css; disabled when prefers-reduced-motion.
 */
export function VibeAnimatedArt({ slug, accent }: VibeAnimatedArtProps) {
  const base =
    'vibe-animated-art inline-flex h-28 w-28 shrink-0 items-center justify-center md:h-32 md:w-32 [&_svg]:h-full [&_svg]:w-full [&_svg]:max-h-[5.5rem] [&_svg]:max-w-[5.5rem] md:[&_svg]:max-h-[6.5rem] md:[&_svg]:max-w-[6.5rem]';

  const style = {
    '--vibe-art-accent': accent,
    color: accent,
  } as CSSProperties;

  let inner: ReactNode;
  switch (slug) {
    case 'emotions':
      inner = <EmotionsArt />;
      break;
    case 'zodiac':
      inner = <ZodiacArt />;
      break;
    case 'fictious':
      inner = <FictiousArt />;
      break;
    case 'career':
      inner = <CareerArt />;
      break;
    case 'trends':
      inner = <TrendsArt />;
      break;
    default:
      inner = <EmotionsArt />;
  }

  return (
    <div className={`${base} vibe-animated-art--${slug}`} style={style} aria-hidden>
      {inner}
    </div>
  );
}

function EmotionsArt() {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle className="vibe-art-emotions-blob vibe-art-emotions-blob--a" cx="38" cy="42" r="22" fill="currentColor" opacity="0.35" />
      <circle className="vibe-art-emotions-blob vibe-art-emotions-blob--b" cx="58" cy="38" r="18" fill="currentColor" opacity="0.45" />
      <circle className="vibe-art-emotions-blob vibe-art-emotions-blob--c" cx="48" cy="58" r="14" fill="currentColor" opacity="0.55" />
    </svg>
  );
}

function ZodiacArt() {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="50" cy="50" r="3" fill="currentColor" opacity="0.9" />
      <g className="vibe-art-zodiac-orbit" style={{ transformOrigin: '50px 50px' }}>
        <circle className="vibe-art-zodiac-star" cx="50" cy="22" r="2.5" fill="currentColor" />
        <circle className="vibe-art-zodiac-star vibe-art-zodiac-star--d1" cx="72" cy="38" r="2" fill="currentColor" />
        <circle className="vibe-art-zodiac-star vibe-art-zodiac-star--d2" cx="65" cy="68" r="2.2" fill="currentColor" />
        <circle className="vibe-art-zodiac-star vibe-art-zodiac-star--d3" cx="35" cy="68" r="2" fill="currentColor" />
        <circle className="vibe-art-zodiac-star vibe-art-zodiac-star--d4" cx="28" cy="38" r="2.2" fill="currentColor" />
      </g>
    </svg>
  );
}

function FictiousArt() {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <g className="vibe-art-book">
        <path
          d="M28 28h22v44H28c-3 0-6-2.5-6-6V34c0-3.5 3-6 6-6z"
          fill="currentColor"
          fillOpacity="0.25"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeOpacity="0.5"
        />
        <path
          d="M50 28h22c3 0 6 2.5 6 6v32c0 3.5-3 6-6 6H50V28z"
          fill="currentColor"
          fillOpacity="0.18"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeOpacity="0.45"
        />
        <path d="M50 32v36" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.35" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function CareerArt() {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <g className="vibe-art-career-bars">
        <rect className="vibe-art-career-bar" x="22" y="52" width="10" height="26" rx="2" fill="currentColor" fillOpacity="0.35" />
        <rect className="vibe-art-career-bar vibe-art-career-bar--d1" x="36" y="44" width="10" height="34" rx="2" fill="currentColor" fillOpacity="0.42" />
        <rect className="vibe-art-career-bar vibe-art-career-bar--d2" x="50" y="38" width="10" height="40" rx="2" fill="currentColor" fillOpacity="0.5" />
        <rect className="vibe-art-career-bar vibe-art-career-bar--d3" x="64" y="48" width="10" height="30" rx="2" fill="currentColor" fillOpacity="0.38" />
      </g>
    </svg>
  );
}

function TrendsArt() {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        className="vibe-art-trends-line"
        d="M18 72 L32 58 L46 62 L58 38 L72 44 L86 28"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        strokeOpacity="0.85"
      />
      <circle className="vibe-art-trends-dot" cx="86" cy="28" r="4" fill="currentColor" fillOpacity="0.9" />
    </svg>
  );
}
