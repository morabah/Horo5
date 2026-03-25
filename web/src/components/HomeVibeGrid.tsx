import { VibeCommerceCard } from './VibeCommerceCard';
import { vibes } from '../data/site';

/**
 * Homepage-only: five commerce cards → /vibes/:slug (no editorial stack, no scroll-spy).
 */
export function HomeVibeGrid() {
  return (
    <section className="bg-papyrus px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-8 border-b border-label/12 pb-5 sm:mb-10" data-reveal>
          <h2 className="font-headline text-base font-semibold uppercase tracking-[0.18em] text-label sm:text-lg md:text-xl">Find your vibe</h2>
          <p className="font-body mt-3 max-w-2xl text-sm text-clay/90 sm:text-[15px]">
            Five lines. Five moods. Tap to explore.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3 2xl:grid-cols-5">
          {vibes.map((v, i) => {
            const stagger = (['stagger-1', 'stagger-2', 'stagger-3', 'stagger-4', 'stagger-5'] as const)[i] ?? 'stagger-5';
            return (
              <VibeCommerceCard
                key={v.slug}
                id={`vibe-${v.slug}`}
                vibe={v}
                titleTag="h3"
                variant="see-vibe"
                className={i === 1 ? '2xl:mt-6' : i === 3 ? '2xl:mt-10' : i === 4 ? '2xl:mt-4' : undefined}
                linkClassName="scroll-mt-[calc(5.5rem+env(safe-area-inset-top,0px))]"
                data-reveal={stagger}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
