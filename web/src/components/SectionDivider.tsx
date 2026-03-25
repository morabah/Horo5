type SectionDividerVariant = 'heroFlow' | 'trustDiamond' | 'latestFunnel';

type SectionDividerProps = {
  variant: SectionDividerVariant;
};

const stroke = {
  width: 1.75,
  cap: 'round' as const,
  join: 'round' as const,
};

/**
 * Decorative SVG strokes between homepage sections — echoes VibeAnimatedArt line language.
 * Wrapper uses `data-reveal="divider"` + `section-divider-wrap`; stroke draws when `.revealed` (see index.css).
 */
export function SectionDivider({ variant }: SectionDividerProps) {
  const common = 'section-divider-wrap pointer-events-none block w-full text-stone/35';

  if (variant === 'heroFlow') {
    return (
      <div data-reveal="divider" className={`${common} -my-2 h-9 sm:h-10`} aria-hidden>
        <svg className="h-full w-full" viewBox="0 0 320 56" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
          <path
            pathLength="1"
            d="M160 4 C 200 18, 120 38, 160 52"
            stroke="currentColor"
            strokeWidth={stroke.width}
            strokeLinecap={stroke.cap}
            strokeLinejoin={stroke.join}
            fill="none"
          />
        </svg>
      </div>
    );
  }

  if (variant === 'trustDiamond') {
    return (
      <div data-reveal="divider" className={`${common} -my-2 h-8 text-desert-sand/45 sm:h-9`} aria-hidden>
        <svg className="h-full w-full" viewBox="0 0 400 48" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
          <path
            pathLength="1"
            d="M8 24 H172 M228 24 H392 M200 12 L208 24 L200 36 L192 24 Z"
            stroke="currentColor"
            strokeWidth={stroke.width}
            strokeLinecap={stroke.cap}
            strokeLinejoin={stroke.join}
            fill="none"
          />
        </svg>
      </div>
    );
  }

  /* latestFunnel */
  return (
    <div data-reveal="divider" className={`${common} -my-2 h-9 sm:h-10`} aria-hidden>
      <svg className="h-full w-full" viewBox="0 0 320 56" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
        <path
          pathLength="1"
          d="M40 8 L160 44"
          stroke="currentColor"
          strokeWidth={stroke.width}
          strokeLinecap={stroke.cap}
          strokeLinejoin={stroke.join}
          fill="none"
        />
        <path
          pathLength="1"
          d="M280 8 L160 44"
          stroke="currentColor"
          strokeWidth={stroke.width}
          strokeLinecap={stroke.cap}
          strokeLinejoin={stroke.join}
          fill="none"
        />
      </svg>
    </div>
  );
}
