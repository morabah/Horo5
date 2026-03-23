/**
 * HORO wordmark — inline SVG text (vector, scales crisply).
 * Typography approximates the brand serif; replace paths with official SVG when available.
 */
type BrandLogoProps = {
  /** Dark = on light glass / Papyrus. Light = on Obsidian / dark UI. */
  variant?: 'dark' | 'light';
  className?: string;
};

export function BrandLogo({ variant = 'dark', className = '' }: BrandLogoProps) {
  const fill = variant === 'light' ? '#f5f0e8' : '#1a1a1a';

  return (
    <svg
      viewBox="0 0 260 64"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={`h-10 w-auto shrink-0 md:h-12 lg:h-[3.25rem] ${className}`}
      preserveAspectRatio="xMinYMid meet"
    >
      {/*
        Inline SVG text = true vector scaling. Font loads from document (Cormorant Garamond).
        Replace with &lt;path&gt; from design export when you have the official outlines.
      */}
      <text
        x="0"
        y="48"
        fill={fill}
        fontFamily="'Cormorant Garamond', Georgia, 'Times New Roman', serif"
        fontSize="52"
        fontWeight="500"
        letterSpacing="-0.04em"
      >
        HORO
      </text>
    </svg>
  );
}
