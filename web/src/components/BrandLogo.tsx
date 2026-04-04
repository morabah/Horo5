type BrandLogoProps = {
  /** Dark = on light glass / Papyrus. Light = on Obsidian / dark UI. */
  variant?: 'dark' | 'light';
  className?: string;
};

export function BrandLogo({ variant = 'dark', className = '' }: BrandLogoProps) {
  const wordmarkSrc = `${import.meta.env.BASE_URL}brand/horo-wordmark.jpg`;
  const shellClass =
    variant === 'light'
      ? 'bg-papyrus/96 ring-1 ring-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.22)]'
      : 'bg-white/96 ring-1 ring-stone/45 shadow-[0_12px_24px_rgba(26,26,26,0.08)]';

  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 overflow-hidden rounded-sm ${shellClass} ${className}`}
    >
      <span className="block h-10 w-[12rem] overflow-hidden md:h-12 md:w-[14rem] lg:h-[3.25rem] lg:w-[15rem]">
        <img
          src={wordmarkSrc}
          alt=""
          className="h-full w-full object-cover object-center"
          loading="eager"
          decoding="async"
        />
      </span>
    </span>
  );
}
