import { Link } from 'react-router-dom';
import {
  getFeelingCollectionVisual,
  imgUrl,
  resolveProductImageSrcForDisplay,
} from '../data/images';
import { getFeelings } from '../data/site';
import { useUiLocale } from '../i18n/ui-locale';

function getFeaturedFeelings() {
  return getFeelings()
    .filter((feeling) => feeling.active !== false)
    .map((feeling, index) => ({ feeling, index }))
    .sort((a, b) => (a.feeling.sortOrder ?? a.index) - (b.feeling.sortOrder ?? b.index) || a.index - b.index)
    .map((entry) => entry.feeling)
    .slice(0, 4);
}

export function HomeFeelingCards() {
  const { copy } = useUiLocale();
  const feelings = getFeaturedFeelings();

  if (feelings.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="home-feelings-title"
      className="border-t border-stone/20 bg-papyrus px-4 py-12 sm:px-5 md:py-14 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-end justify-between gap-4" data-reveal>
          <div>
            <p className="font-label text-[12px] font-semibold uppercase tracking-[0.2em] text-label">
              {copy.home.feelingsEyebrow}
            </p>
            <h2 id="home-feelings-title" className="font-headline mt-2 text-[1.6rem] font-semibold leading-tight tracking-tight text-obsidian md:text-[1.75rem]">
              {copy.home.feelingsTitle}
            </h2>
          </div>
          <Link
            to="/feelings"
            className="font-body hidden min-h-11 items-center justify-center text-sm font-medium text-deep-teal underline-offset-4 transition-colors hover:text-obsidian hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal sm:inline-flex"
          >
            {copy.home.feelingsCta}
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {feelings.map((feeling, index) => {
            const visuals = getFeelingCollectionVisual(feeling.slug);
            const src = visuals.cover.src || visuals.hero.src || visuals.proof.src;
            const alt = visuals.cover.alt || visuals.hero.alt || visuals.proof.alt || `${feeling.name} feeling`;
            const reveal = (['stagger-1', 'stagger-2', 'stagger-3', 'stagger-4'] as const)[index % 4];

            return (
              <Link
                key={feeling.slug}
                id={`feeling-${feeling.slug}`}
                to={`/feelings/${feeling.slug}`}
                data-reveal={reveal}
                className="feeling-tile group relative isolate flex aspect-[1/1.1] min-h-[160px] overflow-hidden rounded-[18px] bg-obsidian p-4 text-white shadow-sm transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal md:min-h-[260px] md:p-6"
              >
                {src ? (
                  <img
                    src={imgUrl(resolveProductImageSrcForDisplay(src), 900)}
                    alt={alt}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                ) : null}
                <span
                  aria-hidden
                  className="absolute inset-0 bg-linear-to-b from-obsidian/10 via-obsidian/28 to-obsidian/78"
                />
                <span className="relative mt-auto font-headline text-[1.45rem] font-semibold leading-tight tracking-tight text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)] md:text-[2rem]">
                  {feeling.name}
                </span>
              </Link>
            );
          })}
        </div>

        <div className="mt-6 sm:hidden">
          <Link
            to="/feelings"
            className="font-body inline-flex min-h-11 items-center justify-center text-sm font-medium text-deep-teal underline-offset-4 transition-colors hover:text-obsidian hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
          >
            {copy.home.feelingsCta}
          </Link>
        </div>
      </div>
    </section>
  );
}
