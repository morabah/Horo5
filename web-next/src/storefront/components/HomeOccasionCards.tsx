import { Link } from 'react-router-dom';
import { getOccasionCollectionVisual, heroVectorizedV2, imgUrl } from '../data/images';
import { getOccasions } from '../data/site';
import { useUiLocale } from '../i18n/ui-locale';

export function HomeOccasionCards() {
  const { copy } = useUiLocale();
  const cards = getOccasions()
    .filter((occasion) => occasion.active !== false)
    .map((occasion, index) => ({ occasion, index }))
    .sort((a, b) => (a.occasion.sortOrder ?? a.index) - (b.occasion.sortOrder ?? b.index) || a.index - b.index)
    .slice(0, 4)
    .map(({ occasion }) => {
      const visual = getOccasionCollectionVisual(occasion.slug);
      const src = visual.hero.src || visual.proof.src || occasion.cardImageSrc;
      return {
        accent: occasion.accent,
        href: `/occasions/${occasion.slug}`,
        label: occasion.name,
        imageSrc: src && src !== heroVectorizedV2 ? src : '',
        imageAlt: visual.hero.alt || occasion.heroImageAlt || occasion.name,
        slug: occasion.slug,
      };
    });

  if (cards.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="home-occasions-title"
      className="border-t border-stone/20 bg-linen px-4 py-12 sm:px-5 md:py-14 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-end justify-between gap-4" data-reveal>
          <h2 id="home-occasions-title" className="font-headline text-[1.6rem] font-semibold leading-tight tracking-tight text-obsidian md:text-[1.75rem]">
            {copy.home.occasionsTitle}
          </h2>
          <Link
            to="/occasions"
            className="font-body hidden min-h-11 items-center justify-center text-sm font-medium text-deep-teal underline-offset-4 transition-colors hover:text-obsidian hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal sm:inline-flex"
          >
            {copy.home.occasionsCta}
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
          {cards.map((card, index) => {
            const reveal = (['stagger-1', 'stagger-2', 'stagger-3', 'stagger-4'] as const)[index % 4];
            return (
              <Link
                key={card.slug}
                to={card.href}
                data-reveal={reveal}
                className="group relative isolate flex min-h-16 items-center overflow-hidden rounded-[18px] border border-stone/55 bg-white/82 p-5 text-obsidian shadow-[0_18px_44px_-30px_rgba(26,26,26,0.2)] transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal md:min-h-24 md:p-6"
              >
                {card.imageSrc ? (
                  <img
                    src={imgUrl(card.imageSrc, 900)}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    aria-hidden
                    className="absolute inset-0 h-full w-full object-cover opacity-32 transition-opacity duration-300 group-hover:opacity-42"
                  />
                ) : null}
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0 w-1.5"
                  style={{ backgroundColor: card.accent ?? 'var(--color-clay-action)' }}
                />
                <span className="relative font-headline text-[1.2rem] font-semibold leading-tight tracking-tight md:text-[1.5rem]">
                  {card.label}
                </span>
              </Link>
            );
          })}
        </div>

        <div className="mt-6 sm:hidden">
          <Link
            to="/occasions"
            className="font-body inline-flex min-h-11 items-center justify-center text-sm font-medium text-deep-teal underline-offset-4 transition-colors hover:text-obsidian hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
          >
            {copy.home.occasionsCta}
          </Link>
        </div>
      </div>
    </section>
  );
}
