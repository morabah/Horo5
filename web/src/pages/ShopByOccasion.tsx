import { Link } from 'react-router-dom';
import { TeeImageFrame } from '../components/TeeImage';
import { OCCASION_SCHEMA } from '../data/domain-config';
import { occasions } from '../data/site';

function FeaturedOccasionCard() {
  const featured = occasions[0];

  return (
    <Link
      to={`/occasions/${featured.slug}`}
      className="group grid gap-6 overflow-hidden rounded-[20px] border border-stone/70 bg-white/70 p-4 text-inherit no-underline shadow-[0_24px_60px_-28px_rgba(26,26,26,0.28)] transition-transform duration-300 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal md:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] md:items-center md:p-6"
    >
      <div className="overflow-hidden rounded-[18px]">
        <div className="transition-transform duration-500 ease-out group-hover:scale-[1.02]">
          <TeeImageFrame
            src={featured.cardImageSrc}
            alt={featured.cardImageAlt}
            w={1200}
            eager
            aspectRatio="4/3"
            borderRadius="18px"
          />
        </div>
      </div>
      <div className="min-w-0">
        <h2 className="font-headline text-[clamp(1.5rem,2vw,2rem)] font-semibold leading-tight text-obsidian">{featured.name}</h2>
        <p className="mt-3 max-w-md font-body text-base leading-relaxed text-warm-charcoal">{featured.blurb}</p>
        {featured.priceHint ? (
          <p className="mt-4 font-body text-sm leading-relaxed text-clay-earth">{featured.priceHint}</p>
        ) : null}
        <span className="font-label mt-5 inline-flex min-h-12 items-center justify-center rounded-sm border border-stone bg-white px-6 py-3 text-[11px] font-medium uppercase tracking-[0.2em] text-obsidian shadow-sm transition-colors hover:border-desert-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal">
          {OCCASION_SCHEMA.copy.featuredCta}
        </span>
      </div>
    </Link>
  );
}

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
  const secondaryOccasions = occasions.filter((occasion) => occasion.slug !== featured.slug);

  return (
    <div className="bg-papyrus pb-16 pt-8 md:pb-20 md:pt-10">
      <section className="mx-auto max-w-7xl px-6 md:px-10" aria-labelledby="occasion-hub-title">
        <div className="max-w-2xl">
          <p className="label mb-3">{OCCASION_SCHEMA.copy.hubEyebrow}</p>
          <h1 id="occasion-hub-title" className="font-headline text-[clamp(2.2rem,5vw,3.75rem)] font-semibold leading-[0.95] tracking-tight text-obsidian">
            {OCCASION_SCHEMA.copy.hubTitle}
          </h1>
          <p className="mt-4 font-body text-base leading-relaxed text-warm-charcoal md:text-[1.0625rem]">
            {OCCASION_SCHEMA.copy.hubSubtitle}
          </p>
        </div>

        <div className="mt-8 space-y-5 md:mt-10 md:space-y-6">
          <FeaturedOccasionCard />

          <div className="grid gap-4 md:grid-cols-2 md:gap-5">
            {secondaryOccasions.map((occasion) => (
              <SecondaryOccasionCard key={occasion.slug} {...occasion} />
            ))}
          </div>
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
