import { Link } from 'react-router-dom';
import { VibeCommerceCard } from '../components/VibeCommerceCard';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { vibes } from '../data/site';

export function ShopByVibe() {
  useScrollReveal();

  return (
    <div className="bg-papyrus px-4 py-8 sm:py-10 md:px-8 md:py-12">
      <div className="container mx-auto max-w-[1200px]">
        <p className="label mb-2">Shop by vibe</p>
        <h1 className="font-headline text-obsidian mb-3 text-[clamp(1.5rem,3vw,2rem)] font-medium leading-snug">Which vibe is yours?</h1>
        <p className="mb-6 max-w-xl text-warm-charcoal sm:mb-8">Every design starts with a feeling. Start with yours.</p>

        <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {vibes.map((v, i) => {
            const stagger = (['stagger-1', 'stagger-2', 'stagger-3', 'stagger-4', 'stagger-5'] as const)[i] ?? 'stagger-5';
            return (
              <VibeCommerceCard key={v.slug} vibe={v} titleTag="h2" variant="explore" className="h-full" data-reveal={stagger} />
            );
          })}
        </div>

        <div className="mt-10 border-t border-stone/10 pt-5">
          <p className="font-body text-xs text-clay/75">Or explore another way</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link className="btn btn-secondary text-sm" to="/occasions">
              Shop by Occasion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
