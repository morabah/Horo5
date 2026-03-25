import { Link } from 'react-router-dom';
import { TeeImageFrame } from '../components/TeeImage';
import { OCCASION_SCHEMA } from '../data/domain-config';
import { getOccasionCollectionVisual, imgUrl } from '../data/images';
import { occasions } from '../data/site';

function SecondaryOccasionCard({ slug, name, blurb, cardImageSrc, cardImageAlt }: (typeof occasions)[number]) {
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

export function ShopByOccasion() {
  const featured = occasions[0];
  const featuredVisual = getOccasionCollectionVisual(featured.slug).hero;
  const secondaryOccasions = occasions.filter((occasion) => occasion.slug !== featured.slug);

  return (
    <div className="bg-papyrus pb-16 md:pb-20">
      <section className="relative isolate overflow-hidden bg-obsidian text-white" aria-labelledby="occasion-hub-title">
        <div className="relative h-[50vh] min-h-[26rem] md:h-[60vh] md:min-h-[34rem]">
          <img
            src={imgUrl(featuredVisual.src, 1800)}
            alt={featuredVisual.alt}
            className="absolute inset-0 h-full w-full object-cover"
            width={1800}
            height={1200}
            decoding="async"
            style={featuredVisual.objectPosition ? { objectPosition: featuredVisual.objectPosition } : undefined}
          />
          <div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(18,18,18,0.2)_0%,rgba(18,18,18,0.42)_48%,rgba(18,18,18,0.9)_100%)]"
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-0">
            <div className="mx-auto max-w-7xl px-6 pb-8 md:px-10 md:pb-12">
              <div className="max-w-2xl">
                <p className="font-label mb-3 text-[10px] font-medium uppercase tracking-[0.24em] text-white/78 md:text-[11px]">
                  {OCCASION_SCHEMA.copy.hubEyebrow}
                </p>
                <h1 id="occasion-hub-title" className="font-headline text-[clamp(2.3rem,5vw,4.4rem)] font-semibold leading-[0.95] tracking-tight text-white">
                  {OCCASION_SCHEMA.copy.hubTitle}
                </h1>
                <p className="mt-4 max-w-xl font-body text-base leading-relaxed text-white/88 md:text-[1.0625rem]">
                  {OCCASION_SCHEMA.copy.hubSubtitle}
                </p>
                {featured.priceHint ? (
                  <p className="font-label mt-5 text-[10px] font-medium uppercase tracking-[0.22em] text-white/74 md:text-[11px]">
                    {featured.priceHint}
                  </p>
                ) : null}
                <div className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                  <Link
                    to={`/occasions/${featured.slug}`}
                    className="font-label inline-flex min-h-12 items-center justify-center rounded-sm bg-primary px-8 py-3 text-sm font-medium uppercase tracking-[0.2em] text-obsidian shadow-[0_18px_38px_-18px_rgba(0,0,0,0.72)] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    {OCCASION_SCHEMA.copy.featuredCta}
                  </Link>
                  <Link
                    to="/vibes"
                    className="link-underline-reveal font-label inline-flex min-h-11 items-center text-[11px] font-medium uppercase tracking-[0.2em] text-white/86 hover:text-white"
                  >
                    {OCCASION_SCHEMA.copy.secondaryNavCta}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pt-8 md:px-10 md:pt-10" aria-labelledby="occasion-grid-title">
        <div className="mb-8 md:mb-10">
          <p className="font-label text-[10px] font-medium uppercase tracking-[0.22em] text-label">{featured.name}</p>
          <h2 id="occasion-grid-title" className="font-headline mt-3 text-[1.6rem] font-semibold tracking-tight text-obsidian md:text-[2rem]">
            Explore the rest of the edit
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 md:gap-5">
          {secondaryOccasions.map((occasion) => (
            <SecondaryOccasionCard key={occasion.slug} {...occasion} />
          ))}
        </div>

        <div className="mt-10 border-t border-stone/40 pt-6">
          <p className="font-body text-sm text-clay-earth">{OCCASION_SCHEMA.copy.secondaryNavLabel}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link className="btn btn-ghost" to="/vibes">
              {OCCASION_SCHEMA.copy.secondaryNavCta}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
