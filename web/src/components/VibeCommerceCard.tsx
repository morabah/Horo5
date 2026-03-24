import { Link } from 'react-router-dom';
import type { Vibe } from '../data/site';
import { glassInteractive } from '../lib/glassInteractive';
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

  const titleClassName = [
    'font-pdp-serif mb-0.5 line-clamp-2 font-normal leading-tight tracking-wide text-[clamp(1rem,5.2cqw,1.375rem)]',
    glassInteractive.title,
  ].join(' ');

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
      <div className="relative @container/vibe-card flex aspect-4/5 w-full flex-1 flex-col overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out motion-safe:group-hover:scale-105 motion-reduce:group-hover:scale-100"
          style={{ backgroundImage: `url(${imgUrl(cover, 960)})` }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 top-[45%] bg-linear-to-t from-black/80 via-black/25 to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-linear-to-tr opacity-25"
          style={{
            background: `linear-gradient(to top right, ${vibe.accent}55, transparent 50%)`,
          }}
          aria-hidden
        />

        <div className="absolute inset-x-0 bottom-0 p-[clamp(0.75rem,3.5cqw,1.25rem)]">
          <div
            className={[
              'glass-vibe-card-footer relative flex max-h-[min(36cqh,12rem)] flex-col justify-center overflow-hidden rounded-[clamp(0.875rem,3.2cqw,1.25rem)] border border-white/90 px-[clamp(1rem,4cqw,1.25rem)] py-[clamp(0.625rem,2.2cqh,0.875rem)] shadow-2xl shadow-black/20 backdrop-blur-2xl',
              glassInteractive.surfaceBottom,
            ].join(' ')}
          >
            {/* Subtle inner glow for physical glass bevel effect */}
            <div
              className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/20"
              style={{ borderRadius: 'inherit' }}
              aria-hidden
            />

            <div className="relative z-10 flex items-center gap-[clamp(0.5rem,2cqw,0.875rem)]">
              <span
                className={[
                  'mt-0.5 h-[clamp(0.375rem,1.8cqw,0.5rem)] w-[clamp(0.375rem,1.8cqw,0.5rem)] shrink-0 rounded-full shadow-md',
                  glassInteractive.accentDot,
                ].join(' ')}
                style={{ backgroundColor: vibe.accent }}
                aria-hidden
              />
              {titleEl}
            </div>
            <p
              className={[
                'relative z-10 font-body mt-1 line-clamp-2 pl-[clamp(1.125rem,5cqw,1.375rem)] text-[clamp(0.6875rem,2.8cqw,0.84rem)] leading-snug',
                glassInteractive.body,
              ].join(' ')}
            >
              {vibe.tagline}
            </p>
            <span
              className={[
                'relative z-10 font-label mt-2 inline-flex items-center gap-1.5 pl-[clamp(1.125rem,5cqw,1.375rem)] text-[clamp(0.5625rem,2.4cqw,0.625rem)] font-medium uppercase tracking-[0.25em]',
                glassInteractive.cta,
              ].join(' ')}
            >
              <span className="relative inline-flex items-center gap-1.5 pb-0.5 after:pointer-events-none after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-current after:opacity-90 after:transition-[width] after:duration-300 after:ease-out motion-reduce:after:transition-none group-hover:after:w-full">
                {variant === 'explore' ? (
                  <>
                    Shop vibe
                    <span
                      aria-hidden
                      className="text-[10px] leading-none transition-transform duration-300 ease-out motion-safe:group-hover:translate-x-0.5 motion-reduce:transition-none"
                    >
                      →
                    </span>
                  </>
                ) : (
                  <>
                    See vibe
                    <span
                      aria-hidden
                      className="text-[10px] leading-none transition-transform duration-300 ease-out motion-safe:group-hover:translate-x-0.5 motion-reduce:transition-none"
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
