import { Link } from 'react-router-dom';
import { vibes, productsByVibe } from '../data/site';
import { getVibeCollectionVisual, imgUrl } from '../data/images';
import { HOME_COPY } from '../data/homeContent';

const VIBE_COL_SPANS = ['md:col-span-12', 'md:col-span-3', 'md:col-span-3', 'md:col-span-3', 'md:col-span-3'] as const;

export function HomeStickyVibeShowcase() {
  return (
    <section
      aria-labelledby="home-vibes-title"
      className="border-t border-stone/20 bg-papyrus px-4 py-16 sm:px-6 md:py-20 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 max-w-xl md:mb-10" data-reveal>
          <p className="font-label text-[10px] font-medium uppercase tracking-[0.3em] text-label">
            {HOME_COPY.vibesEyebrow}
          </p>
          <h2
            id="home-vibes-title"
            className="font-headline mt-2 text-[clamp(1.5rem,3.5vw,2.25rem)] font-medium leading-tight tracking-tight text-obsidian"
          >
            {HOME_COPY.vibesTitle}
          </h2>
          <p className="mt-3 font-body text-sm leading-relaxed text-warm-charcoal md:text-[15px]">{HOME_COPY.vibesBody}</p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:gap-4" data-reveal="stagger-1">
          {vibes.map((v, index) => {
            const visual = getVibeCollectionVisual(v.slug).hero;
            const designCount = productsByVibe(v.slug).length;
            return (
              <Link
                key={v.slug}
                id={`vibe-${v.slug}`}
                to={`/vibes/${v.slug}`}
                aria-label={`Open the ${v.name} vibe — ${v.tagline}`}
                style={{ ['--vibe-accent' as string]: v.accent }}
                className={`group relative isolate block overflow-hidden transition-[transform] duration-500 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal hover:scale-[1.01] ${index === 0 ? 'min-h-[min(72vh,640px)]' : 'min-h-[min(56vh,420px)]'} ${VIBE_COL_SPANS[index] ?? 'md:col-span-12'}`}
              >
                <img
                  src={imgUrl(visual.src, 1000)}
                  alt=""
                  className="vibe-card-img absolute inset-0 h-full w-full object-cover"
                />
                <div className="glass-vibe-card-footer vibe-card-text-strip absolute inset-x-0 bottom-0 top-[66%] z-1 flex flex-col justify-end px-5 pb-5 pt-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="vibe-dot-pulse size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: v.accent }}
                      aria-hidden
                    />
                    <h3 className="font-headline text-lg font-semibold tracking-tight text-obsidian md:text-xl">{v.name}</h3>
                  </div>
                  <p className="mt-1.5 max-w-[22rem] font-body text-sm leading-snug text-warm-charcoal md:text-[15px]">
                    {v.tagline}
                  </p>
                  <div className="mt-2.5 flex items-center justify-between">
                    <span className="font-label text-[10px] font-medium uppercase tracking-[0.16em] text-clay">
                      {designCount} designs
                    </span>
                    <span
                      className="vibe-card-explore font-label text-[10px] font-semibold uppercase tracking-[0.18em]"
                      style={{ color: v.accent }}
                      aria-hidden
                    >
                      Explore →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
