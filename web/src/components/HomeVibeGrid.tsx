import { VibeCommerceCard } from './VibeCommerceCard';
import { feelings } from '../data/site';

/**
 * Homepage-only: five commerce cards → /feelings/:slug (no editorial stack, no scroll-spy).
 */
export function HomeVibeGrid() {
  return (
    <section aria-labelledby="home-vibe-grid-title" className="bg-papyrus px-4 pb-10 pt-4 sm:px-6 sm:pb-12 sm:pt-6 lg:px-8 lg:pb-14 lg:pt-8">
      <div className="mx-auto max-w-[1400px]">
        <h2 id="home-vibe-grid-title" className="sr-only">
          Shop by feeling
        </h2>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3 2xl:grid-cols-5">
          {feelings.map((f, i) => {
            const stagger = (['stagger-1', 'stagger-2', 'stagger-3', 'stagger-4', 'stagger-5'] as const)[i] ?? 'stagger-5';
            return (
              <VibeCommerceCard
                key={f.slug}
                id={`feeling-${f.slug}`}
                feeling={f}
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
