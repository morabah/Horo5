/** Minimal burgundy line icons for homepage feeling tiles (mockup-aligned). */
export function FeelingTileIcon({ slug, className = '' }: { slug: string; className?: string }) {
  const stroke = 'currentColor';
  const common = {
    width: 48,
    height: 48,
    viewBox: '0 0 48 48',
    fill: 'none',
    stroke,
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    'aria-hidden': true,
  };

  switch (slug) {
    case 'independence':
      return (
        <svg {...common}>
          <circle cx="27" cy="12" r="3" />
          <path d="M25 17l-4 8 6 4 5 9" />
          <path d="M22 25l-8 5" />
          <path d="M29 20l7 5" />
          <path d="M8 32c5-3 10-4.5 16-4.5" />
          <path d="M8 39c8-5 17-6.5 30-4" />
        </svg>
      );
    case 'care':
      return (
        <svg {...common}>
          <path d="M15 35V22c0-3 4-3 4 0v7" />
          <path d="M33 35V22c0-3-4-3-4 0v7" />
          <path d="M19 29l5 5 5-5" />
          <path d="M24 18c-4-5-10-1.5-7 3.5l7 7 7-7c3-5-3-8.5-7-3.5z" />
        </svg>
      );
    case 'calm':
      return (
        <svg {...common}>
          <circle cx="24" cy="11" r="3.5" />
          <path d="M18 21c3-3 9-3 12 0" />
          <path d="M15 34c3-4 6-6 9-6s6 2 9 6" />
          <path d="M13 38c7 2 15 2 22 0" />
          <path d="M11 30c4 2 8 3 13 3s9-1 13-3" />
        </svg>
      );
    case 'rhythm':
      return (
        <svg {...common}>
          <path d="M14 14c7-7 20-3 21 8 1 12-14 18-22 9-8-8-1-22 12-23 11-1 19 8 17 18-3 15-23 17-31 5-7-11 1-25 15-27" />
        </svg>
      );
    case 'boldness':
      return (
        <svg {...common}>
          <path d="M8 36l12-16 8 9 6-8 8 15" />
          <path d="M31 11v14" />
          <path d="M31 11l8 3-8 3" />
        </svg>
      );
    case 'mood':
      return (
        <svg {...common}>
          <circle cx="24" cy="14" r="4" />
          <path d="M12 38c2.5-6 7-9 12-9s9.5 3 12 9" />
          <path d="M18 24h12" />
        </svg>
      );
    case 'zodiac':
      return (
        <svg {...common}>
          <circle cx="24" cy="24" r="10" />
          <path d="M24 14v4M24 30v4M14 24h4M30 24h4" />
          <path d="M17.5 17.5l2.8 2.8M27.7 27.7l2.8 2.8M30.5 17.5l-2.8 2.8M20.3 27.7l-2.8 2.8" />
        </svg>
      );
    case 'trends':
      return (
        <svg {...common}>
          <path d="M10 34l10-12 8 8 10-14" />
          <path d="M30 16h8v8" />
        </svg>
      );
    case 'career':
      return (
        <svg {...common}>
          <rect x="12" y="16" width="24" height="18" rx="2" />
          <path d="M18 16V13a6 6 0 0112 0v3" />
          <path d="M24 24v6" />
        </svg>
      );
    case 'fiction':
      return (
        <svg {...common}>
          <path d="M14 12h20v28H14z" />
          <path d="M18 18h12M18 24h12M18 30h8" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M24 8l4 10h10l-8 6 3 10-9-6-9 6 3-10-8-6h10z" />
        </svg>
      );
  }
}
