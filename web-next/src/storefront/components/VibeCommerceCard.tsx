import { Link } from 'react-router-dom';
import { VIBES_SCHEMA } from '../data/domain-config';
import type { Feeling } from '../data/site';
import { glassInteractive } from '../lib/glassInteractive';
import { getFeelingCollectionVisual, imgUrl } from '../data/images';

const linkBaseClass =
  'group flex h-full min-h-0 flex-col overflow-hidden transition-all duration-700 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal';

export type VibeCommerceCardProps = {
  feeling: Feeling;
  titleTag: 'h2' | 'h3';
  variant: 'explore' | 'see-vibe';
  /** Appended to the shared card link classes (e.g. scroll-mt, data-reveal) */
  linkClassName?: string;
  className?: string;
  id?: string;
  'data-reveal'?: string;
};

export function VibeCommerceCard({
  feeling,
  titleTag,
  variant,
  linkClassName,
  className,
  id,
  'data-reveal': dataReveal,
}: VibeCommerceCardProps) {
  const cover = getFeelingCollectionVisual(feeling.slug).cover;
  const bodyCopy = feeling.blurb || feeling.tagline || '';
  const ctaLabel = variant === 'see-vibe' ? VIBES_SCHEMA.copy.cardSeeVibeCta : VIBES_SCHEMA.copy.cardExploreCta;
  const ariaLabel = VIBES_SCHEMA.copy.cardAriaTemplate
    .replace('{cta}', ctaLabel.replace(/\s*→$/, '').trim())
    .replace('{name}', feeling.name);

  const titleClassName = [
    'font-headline mb-0.5 line-clamp-2 font-semibold leading-tight tracking-tight text-[clamp(1rem,5.2cqw,1.375rem)]',
    glassInteractive.title,
  ].join(' ');
  const footerSurfaceClassName =
    variant === 'see-vibe'
      ? 'bg-transparent'
      : 'bg-transparent';

  const titleEl =
    titleTag === 'h2' ? (
      <h2 className={titleClassName}>{feeling.name}</h2>
    ) : (
      <h3 className={titleClassName}>{feeling.name}</h3>
    );

  return (
    <Link
      to={`/feelings/${feeling.slug}`}
      aria-label={ariaLabel}
      className={[linkBaseClass, linkClassName, className].filter(Boolean).join(' ')}
      id={id}
      {...(dataReveal !== undefined ? { 'data-reveal': dataReveal } : {})}
    >
      <div className="relative @container/vibe-card flex aspect-[4/5] w-full flex-1 flex-col overflow-hidden">
        <img
          src={imgUrl(cover.src, 960)}
          alt={cover.alt}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-105 motion-reduce:group-hover:scale-100"
          decoding="async"
          width={960}
          height={1200}
          style={cover.objectPosition ? { objectPosition: cover.objectPosition } : undefined}
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 top-[34%] bg-linear-to-t from-black/78 via-black/18 to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-linear-to-tr opacity-25"
          style={{
            background: `linear-gradient(to top right, ${feeling.accent}55, transparent 50%)`,
          }}
          aria-hidden
        />

        <div className="absolute inset-x-0 bottom-0 p-[clamp(0.75rem,3.5cqw,1.25rem)]">
          <div
            className={[
              'relative flex max-h-[min(28cqh,9.75rem)] flex-col justify-center overflow-hidden px-[clamp(0.95rem,4cqw,1.25rem)] py-[clamp(0.625rem,2cqh,0.875rem)] text-white',
              footerSurfaceClassName,
            ].join(' ')}
          >


            <div className="relative z-10 flex items-center gap-[clamp(0.5rem,2cqw,0.875rem)]">
              <span
                className={[
                  'mt-0.5 h-[clamp(0.375rem,1.8cqw,0.5rem)] w-[clamp(0.375rem,1.8cqw,0.5rem)] shrink-0 rounded-full shadow-md',
                  glassInteractive.accentDot,
                ].join(' ')}
                style={{ backgroundColor: feeling.accent }}
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
              {bodyCopy}
            </p>
            <span
              className={[
                'relative z-10 font-body mt-2 inline-flex items-center gap-1.5 pl-[clamp(1.125rem,5cqw,1.375rem)] text-[clamp(0.75rem,2.7cqw,0.82rem)] font-medium',
                glassInteractive.cta,
              ].join(' ')}
            >
              <span className="relative inline-flex items-center gap-1.5 pb-0.5 after:pointer-events-none after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-current after:opacity-90 after:transition-[width] after:duration-300 after:ease-out motion-reduce:after:transition-none group-hover:after:w-full">
                {ctaLabel.replace(/\s*→$/, '').trim()}
                <span
                  aria-hidden
                  className="text-[10px] leading-none transition-transform duration-300 ease-out motion-safe:group-hover:translate-x-0.5 motion-reduce:transition-none"
                >
                  →
                </span>
              </span>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
