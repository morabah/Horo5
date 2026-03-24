import type { CSSProperties, ReactNode } from 'react';

type VibeAnimatedArtProps = {
  slug: string;
  accent: string;
};

const stroke = {
  width: 2.25,
  cap: 'round' as const,
  join: 'round' as const,
};

/**
 * Decorative animated line-art SVG per vibe — editorial header.
 * Motion: index.css; disabled when prefers-reduced-motion.
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
      inner = <EmotionsLineArt />;
      break;
    case 'zodiac':
      inner = <ZodiacLineArt />;
      break;
    case 'fictious':
      inner = <FictiousLineArt />;
      break;
    case 'career':
      inner = <CareerLineArt />;
      break;
    case 'trends':
      inner = <TrendsLineArt />;
      break;
    default:
      inner = <EmotionsLineArt />;
  }

  return (
    <div className={`${base} vibe-animated-art--${slug}`} style={style} aria-hidden>
      {inner}
    </div>
  );
}

/** Three overlapping ring strokes — soft drift + dash shimmer */
function EmotionsLineArt() {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <g className="vibe-art-emotions-wrap">
        <circle
          className="vibe-art-emotions-ring vibe-art-emotions-ring--a"
          cx="42"
          cy="44"
          r="24"
          stroke="currentColor"
          strokeWidth={stroke.width}
          strokeLinecap="round"
          fill="none"
          opacity="0.85"
        />
        <circle
          className="vibe-art-emotions-ring vibe-art-emotions-ring--b"
          cx="56"
          cy="40"
          r="19"
          stroke="currentColor"
          strokeWidth={stroke.width}
          strokeLinecap="round"
          fill="none"
          opacity="0.75"
        />
        <circle
          className="vibe-art-emotions-ring vibe-art-emotions-ring--c"
          cx="48"
          cy="58"
          r="15"
          stroke="currentColor"
          strokeWidth={stroke.width}
          strokeLinecap="round"
          fill="none"
          opacity="0.95"
        />
      </g>
    </svg>
  );
}

/** Orbit ring + constellation lines + hollow star nodes */
function ZodiacLineArt() {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle
        className="vibe-art-zodiac-orbit-ring"
        cx="50"
        cy="50"
        r="28"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeDasharray="6 5"
        fill="none"
        opacity="0.35"
      />
      <circle cx="50" cy="50" r="4" stroke="currentColor" strokeWidth={stroke.width} fill="none" opacity="0.95" />
      <g className="vibe-art-zodiac-orbit" style={{ transformOrigin: '50px 50px' }}>
        <path
          className="vibe-art-zodiac-constellation"
          d="M50 50 L50 22 M50 50 L72 38 M50 50 L65 68 M50 50 L35 68 M50 50 L28 38"
          stroke="currentColor"
          strokeWidth={1.25}
          strokeLinecap="round"
          fill="none"
          opacity="0.45"
        />
        <circle className="vibe-art-zodiac-node" cx="50" cy="22" r="3.5" stroke="currentColor" strokeWidth={1.5} fill="none" />
        <circle className="vibe-art-zodiac-node vibe-art-zodiac-node--d1" cx="72" cy="38" r="2.8" stroke="currentColor" strokeWidth={1.5} fill="none" />
        <circle className="vibe-art-zodiac-node vibe-art-zodiac-node--d2" cx="65" cy="68" r="3" stroke="currentColor" strokeWidth={1.5} fill="none" />
        <circle className="vibe-art-zodiac-node vibe-art-zodiac-node--d3" cx="35" cy="68" r="2.8" stroke="currentColor" strokeWidth={1.5} fill="none" />
        <circle className="vibe-art-zodiac-node vibe-art-zodiac-node--d4" cx="28" cy="38" r="3" stroke="currentColor" strokeWidth={1.5} fill="none" />
      </g>
    </svg>
  );
}

/** Open book outline */
function FictiousLineArt() {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <g className="vibe-art-book">
        <path
          d="M28 30h22v40H28c-3 0-5-2-5-5V35c0-3 2-5 5-5z"
          stroke="currentColor"
          strokeWidth={stroke.width}
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M50 30h22c3 0 5 2 5 5v30c0 3-2 5-5 5H50V30z"
          stroke="currentColor"
          strokeWidth={stroke.width}
          strokeLinejoin="round"
          fill="none"
        />
        <path d="M50 34v36" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" />
        <path d="M34 48h8M34 56h12" stroke="currentColor" strokeWidth={1.25} strokeLinecap="round" opacity="0.5" />
        <path d="M58 48h12M58 56h8" stroke="currentColor" strokeWidth={1.25} strokeLinecap="round" opacity="0.5" />
      </g>
    </svg>
  );
}

/** Bar outlines — scaleY pulse */
function CareerLineArt() {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <g className="vibe-art-career-bars">
        <rect
          className="vibe-art-career-bar"
          x="22"
          y="52"
          width="10"
          height="26"
          rx="2"
          stroke="currentColor"
          strokeWidth={stroke.width}
          fill="none"
        />
        <rect
          className="vibe-art-career-bar vibe-art-career-bar--d1"
          x="36"
          y="44"
          width="10"
          height="34"
          rx="2"
          stroke="currentColor"
          strokeWidth={stroke.width}
          fill="none"
        />
        <rect
          className="vibe-art-career-bar vibe-art-career-bar--d2"
          x="50"
          y="38"
          width="10"
          height="40"
          rx="2"
          stroke="currentColor"
          strokeWidth={stroke.width}
          fill="none"
        />
        <rect
          className="vibe-art-career-bar vibe-art-career-bar--d3"
          x="64"
          y="48"
          width="10"
          height="30"
          rx="2"
          stroke="currentColor"
          strokeWidth={stroke.width}
          fill="none"
        />
      </g>
    </svg>
  );
}

/** Rising line + hollow cap ring */
function TrendsLineArt() {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        className="vibe-art-trends-line"
        d="M18 72 L32 58 L46 62 L58 38 L72 44 L86 28"
        stroke="currentColor"
        strokeWidth={stroke.width}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle
        className="vibe-art-trends-cap"
        cx="86"
        cy="28"
        r="5"
        stroke="currentColor"
        strokeWidth={stroke.width}
        fill="none"
      />
    </svg>
  );
}
