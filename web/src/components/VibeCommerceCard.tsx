import { Link } from 'react-router-dom';
import type { Vibe } from '../data/site';
import { heroStreet, imgUrl, vibeCovers } from '../data/images';

const linkBaseClass =
  'vibe-commerce-card group flex h-full min-h-0 flex-col overflow-hidden rounded-2xl shadow-xl shadow-black/[0.07] ring-1 ring-black/5 transition-all duration-700 ease-out motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-2xl motion-safe:hover:shadow-black/[0.1] motion-reduce:hover:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal';

export type VibeCommerceCardProps = {
  vibe: Vibe;
  titleTag: 'h2' | 'h3';
  variant: 'explore' | 'see-vibe';
  /** Appended to the shared card link classes (e.g. scroll-mt, data-reveal) */
  linkClassName?: string;
  className?: string;
  id?: string;
  'data-reveal'?: string;
};

export function VibeCommerceCard({
  vibe,
  titleTag,
  variant,
  linkClassName,
  className,
  id,
  'data-reveal': dataReveal,
}: VibeCommerceCardProps) {
  const cover = vibeCovers[vibe.slug] ?? heroStreet;
  const ariaLabel =
    variant === 'explore'
      ? `Shop the ${vibe.name} vibe collection`
      : `See the ${vibe.name} vibe collection`;

  const titleClassName =
    'font-pdp-serif mb-0.5 line-clamp-2 text-lg font-normal leading-tight tracking-wide text-obsidian';

  const titleEl =
    titleTag === 'h2' ? (
      <h2 className={titleClassName}>{vibe.name}</h2>
    ) : (
      <h3 className={titleClassName}>{vibe.name}</h3>
    );

  return (
    <Link
      to={`/vibes/${vibe.slug}`}
      aria-label={ariaLabel}
      className={[linkBaseClass, linkClassName, className].filter(Boolean).join(' ')}
      id={id}
      {...(dataReveal !== undefined ? { 'data-reveal': dataReveal } : {})}
    >
      <div className="relative aspect-4/5 w-full shrink-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out motion-safe:group-hover:scale-105 motion-reduce:group-hover:scale-100"
          style={{ backgroundImage: `url(${imgUrl(cover, 960)})` }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 top-[38%] bg-linear-to-t from-black/45 via-black/10 to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-linear-to-tr opacity-25"
          style={{
            background: `linear-gradient(to top right, ${vibe.accent}55, transparent 50%)`,
          }}
          aria-hidden
        />
      </div>

      <div className="glass-vibe-card-footer vibe-card-text-strip flex min-h-30 shrink-0 flex-col justify-center overflow-hidden border-t border-white/80 px-3 py-2.5 sm:px-3.5">
        <div className="glass-text-inner flex min-h-27 items-start gap-2.5 px-3 py-2.5 sm:min-h-28">
          <span
            className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full shadow-sm ring-2 ring-white/90"
            style={{ backgroundColor: vibe.accent }}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            {titleEl}
            <p className="font-body line-clamp-2 text-[13px] leading-snug text-warm-charcoal">{vibe.tagline}</p>
            <span
              className={
                variant === 'explore'
                  ? 'font-label mt-1.5 inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.25em] text-deep-teal drop-shadow-sm'
                  : 'font-label mt-2 inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.25em] text-deep-teal drop-shadow-sm'
              }
            >
              <span className="relative inline-flex items-center gap-1.5 pb-0.5 after:pointer-events-none after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-current after:opacity-90 after:transition-[width] after:duration-300 after:ease-out motion-reduce:after:transition-none group-hover:after:w-full">
                {variant === 'explore' ? (
                  <>
                    Shop vibe
                    <span
                      aria-hidden
                      className="text-xs leading-none transition-transform duration-300 ease-out motion-safe:group-hover:translate-x-0.5 motion-reduce:transition-none"
                    >
                      →
                    </span>
                  </>
                ) : (
                  <>
                    See vibe
                    <span
                      aria-hidden
                      className="text-sm leading-none transition-transform duration-300 ease-out motion-safe:group-hover:translate-x-0.5 motion-reduce:transition-none"
                    >
                      →
                    </span>
                  </>
                )}
              </span>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
