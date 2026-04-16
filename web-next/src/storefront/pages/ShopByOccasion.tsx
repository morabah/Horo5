import { Link } from 'react-router-dom';
import { PageBreadcrumb } from '../components/PageBreadcrumb';
import { RecentlyViewedStrip } from '../components/RecentlyViewedStrip';
import { TeeImageFrame } from '../components/TeeImage';
import { OCCASION_SCHEMA } from '../data/domain-config';
import { getOccasionCollectionVisual, imgUrl } from '../data/images';
import { useUiLocale } from '../i18n/ui-locale';
import { getOccasions, type Occasion } from '../data/site';

function getOccasionHeroTiles(occasions: Occasion[]) {
  return occasions
    .slice(0, 6)
    .map((o) => {
      const visual = getOccasionCollectionVisual(o.slug);
      return {
        slug: o.slug,
        src: visual.hero.src || visual.proof.src || o.cardImageSrc,
        alt: visual.hero.alt || o.cardImageAlt || o.name,
        objectPosition: visual.hero.objectPosition,
      };
    })
    .filter((t) => t.src);
}

type ShopByOccasionProps = {
  /** When set (e.g. from Next RSC), replaces runtime/static getOccasions() for first paint. */
  initialOccasions?: Occasion[];
};

function SecondaryOccasionCard({ slug, name, blurb, cardImageSrc, cardImageAlt }: Occasion) {
  return (
    <Link
      to={`/occasions/${slug}`}
      className="group overflow-hidden rounded-[18px] border border-stone/70 bg-white/75 text-inherit no-underline shadow-[0_18px_44px_-28px_rgba(26,26,26,0.24)] transition-transform duration-300 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
    >
      <div className="overflow-hidden">
        <div className="transition-transform duration-500 ease-out group-hover:scale-[1.03]">
          <TeeImageFrame src={cardImageSrc} alt={cardImageAlt} w={900} aspectRatio="4/5" borderRadius="0" />
        </div>
      </div>
      <div className="space-y-3 p-4 md:p-5">
        <h2 className="font-headline text-[1.18rem] font-semibold leading-snug text-obsidian">{name}</h2>
        <p className="font-body text-[0.96rem] leading-relaxed text-warm-charcoal">{blurb}</p>
        <span className="font-label inline-flex min-h-11 items-center text-[11px] font-medium uppercase tracking-[0.2em] text-obsidian transition-colors group-hover:text-deep-teal">
          {OCCASION_SCHEMA.copy.secondaryCta}
        </span>
      </div>
    </Link>
  );
}

export function ShopByOccasion({ initialOccasions }: ShopByOccasionProps = {}) {
  const { copy } = useUiLocale();
  const occasions = initialOccasions && initialOccasions.length > 0 ? initialOccasions : getOccasions();
  if (occasions.length === 0) {
    return (
      <div className="bg-papyrus pb-16 md:pb-20">
        <div className="mx-auto max-w-7xl px-4 pt-8 md:px-8 md:pt-10">
          <PageBreadcrumb
            className="mb-6"
            items={[
              { label: copy.shell.home, to: '/' },
              { label: copy.shell.shopByMoment },
            ]}
          />
          <p className="font-body text-warm-charcoal">Moment collections are not available yet. Try again shortly.</p>
          <Link className="btn btn-primary mt-6 inline-flex" to="/">
            {copy.shell.home}
          </Link>
        </div>
      </div>
    );
  }

  const heroTiles = getOccasionHeroTiles(occasions);
  const heroTileCount = Math.max(1, heroTiles.length);

  return (
    <div className="bg-papyrus pb-16 md:pb-20">
      <div className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-7xl flex-col gap-10 px-4 pt-8 md:gap-12 md:px-8 md:pt-10">
        <PageBreadcrumb
          className="mb-0 md:-mb-2"
          items={[
            { label: copy.shell.home, to: '/' },
            { label: copy.shell.shopByMoment },
          ]}
        />

        {/* Hero — photo grid with glass headline bar */}
        <section
          className="relative isolate overflow-hidden"
          aria-label={OCCASION_SCHEMA.copy.hubEyebrow}
        >
          <div
            className="grid min-h-[26rem] grid-cols-2 gap-0.5 bg-obsidian sm:min-h-[30rem] sm:grid-cols-3 sm:gap-1 lg:min-h-[34rem] lg:[grid-template-columns:repeat(var(--hero-tile-count),minmax(0,1fr))]"
            style={{ ['--hero-tile-count' as string]: String(heroTileCount) }}
          >
            {heroTiles.map((tile) => (
              <img
                key={tile.slug}
                src={imgUrl(tile.src, 900)}
                alt={tile.alt}
                className="h-full w-full object-cover"
                style={{ objectPosition: tile.objectPosition }}
                width={900}
                height={1200}
                decoding="async"
              />
            ))}
          </div>
          {/* Minimal vignette — photos are the hero */}
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.2)_100%)]"
            aria-hidden
          />

          {/* Bottom glass bar — headline only */}
          <div className="absolute inset-x-0 bottom-0">
            <div className="feelings-hub-glass-bar flex items-center justify-center px-4 py-5 sm:py-6">
              <h1 className="text-center font-headline text-[clamp(1.5rem,5vw,2.5rem)] font-semibold leading-tight tracking-tight text-white">
                {OCCASION_SCHEMA.copy.hubTitle}
              </h1>
            </div>
          </div>

          {/* Shop All pill — top left */}
          <div className="absolute left-4 top-4 sm:left-6 sm:top-6 md:left-8 md:top-8">
            <Link
              to="/products"
              className="feelings-hub-glass-pill font-label inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full px-4 py-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-white transition-all hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:text-[10px]"
            >
              {copy.shell.shopAll}
              <span className="text-white/50" aria-hidden>→</span>
            </Link>
          </div>
        </section>

        {/* Occasion cards grid */}
        <section aria-labelledby="occasion-grid-title" className="bg-papyrus pb-16 md:pb-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="font-label text-[10px] font-medium uppercase tracking-[0.22em] text-label">Start here</p>
                <h2
                  id="occasion-grid-title"
                  className="font-headline mt-2 text-[1.35rem] font-semibold tracking-tight text-obsidian md:text-[1.6rem]"
                >
                  Browse by moment, then filter inside
                </h2>
              </div>
              <Link
                to="/feelings"
                className="font-label inline-flex min-h-11 items-center text-[11px] font-semibold uppercase tracking-[0.18em] text-deep-teal transition-colors hover:text-obsidian"
              >
                {copy.shell.shopByFeeling}
              </Link>
            </div>
            <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-7">
              {occasions.map((occasion) => (
                <SecondaryOccasionCard key={occasion.slug} {...occasion} />
              ))}
            </div>
          </div>
        </section>
      </div>

      <RecentlyViewedStrip className="border-t border-stone/20" />
    </div>
  );
}
