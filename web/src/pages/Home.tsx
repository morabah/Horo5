import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MerchProductCard } from '../components/MerchProductCard';
import { ProductQuickView } from '../components/ProductQuickView';
import { HomeStickyVibeShowcase } from '../components/HomeStickyVibeShowcase';
import { HomeHeroExplosive } from '../components/HomeHeroExplosive';
import { HomeFeelingExplosion } from '../components/HomeFeelingExplosion';
import { AppIcon } from '../components/AppIcon';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { getProductMedia } from '../data/images';
import { getVibe, products } from '../data/site';
import { BRAND_TRUST_POINTS, PDP_SCHEMA } from '../data/domain-config';

/** Material Symbols per StoryBrand step (Problem 5): vibe → design → delivery */
const STORY_PLAN_STEP_ICONS = ['explore', 'checkroom', 'local_shipping'] as const;

type HomeQuote = {
  quote: string;
  name: string;
  city: string;
  sourceLabel: string;
  sourceHref: string;
};

const HOME_QUOTES: HomeQuote[] = [
  {
    quote: 'Finally, a shirt that feels like a conversation starter without me having to say a word.',
    name: 'Omar K.',
    city: 'Cairo',
    sourceLabel: 'Favorite: Quiet Revolt',
    sourceHref: '/products/quiet-revolt',
  },
  {
    quote: 'The quality of the cotton is insane. 220 GSM makes such a difference in how it hangs.',
    name: 'Sarah M.',
    city: 'Alexandria',
    sourceLabel: 'Favorite: Midnight Compass',
    sourceHref: '/products/midnight-compass',
  },
  {
    quote: "Horo isn't just clothing; it's a mood. I own three pieces and they're all I wear now.",
    name: 'Yassin A.',
    city: 'Giza',
    sourceLabel: 'Shops the Fiction vibe',
    sourceHref: '/vibes/fiction',
  },
];

export function Home() {
  useScrollReveal();
  const [searchParams, setSearchParams] = useSearchParams();
  const latestDrops = products.slice(0, 4);
  const [quickViewSlug, setQuickViewSlug] = useState<string | null>(null);

  useEffect(() => {
    const vibeParam = searchParams.get('vibe');
    if (!vibeParam || !getVibe(vibeParam)) return;

    const id = `vibe-${vibeParam}`;
    const t = window.setTimeout(() => {
      const el = document.getElementById(id);
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete('vibe');
          return next;
        },
        { replace: true },
      );
    }, 120);

    return () => window.clearTimeout(t);
  }, [searchParams, setSearchParams]);

  return (
    <>
      {/* Hero — explosive split-typography (Guidelines §8.2 #1: dark, cinematic, warm) */}
      <HomeHeroExplosive />

      {/* The Feeling — concise problem framing (Guidelines §8.2 #2) */}
      <HomeFeelingExplosion />

      <HomeStickyVibeShowcase />

      {/* Latest drop */}
      <section
        aria-labelledby="home-latest-drop-title"
        className="border-t border-label/10 bg-papyrus px-4 py-14 sm:px-6 md:py-16 lg:px-8 lg:py-20"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col gap-4 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p data-reveal className="font-label text-[10px] font-medium uppercase tracking-[0.22em] text-label">
                Proof in the product
              </p>
              <h2
                id="home-latest-drop-title"
                className="font-headline mt-3 text-[22px] font-medium tracking-tight text-obsidian md:text-[28px] md:leading-[1.3]"
              >
                Just Dropped
              </h2>
            </div>
            <Link
              data-reveal="stagger-1"
              to="/vibes"
              className="font-label inline-flex min-h-12 w-fit items-center justify-center rounded-sm border-2 border-obsidian/90 bg-transparent px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-obsidian transition-colors hover:border-deep-teal hover:text-deep-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
            >
              Shop by Vibe
            </Link>
          </div>
          <div className="grid grid-cols-1 items-stretch gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {latestDrops.map((p, i) => {
              const vibe = getVibe(p.vibeSlug);
              const main = getProductMedia(p.slug).main;
              return (
                <MerchProductCard
                  key={p.slug}
                  slug={p.slug}
                  name={p.name}
                  priceEgp={p.priceEgp}
                  imageSrc={main}
                  imageAlt={`HORO “${p.name}” graphic tee`}
                  merchandisingBadge={p.merchandisingBadge}
                  eyebrow={vibe?.name}
                  eyebrowAccent={vibe?.accent}
                  proofChip={p.fitLabel ?? '220 GSM cotton'}
                  onQuickView={setQuickViewSlug}
                  className="home-latest-product relative h-full transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(26,26,26,0.08)]"
                  data-reveal={(['stagger-1', 'stagger-2', 'stagger-3', 'stagger-4'] as const)[i]}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust row */}
      <section aria-labelledby="home-trust-title" className="bg-papyrus px-4 pb-12 sm:px-6 sm:pb-14 lg:px-8">
        <h2 id="home-trust-title" className="sr-only">
          Trust signals
        </h2>
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {BRAND_TRUST_POINTS.map((item, i) => (
            <div
              key={item.title}
              data-reveal={(['stagger-1', 'stagger-2', 'stagger-3', 'stagger-4'] as const)[i]}
              className="flex items-start gap-4 rounded-[1.5rem] border border-label/10 bg-white/55 px-5 py-5 shadow-[0_12px_32px_rgba(26,26,26,0.05)] backdrop-blur-sm"
            >
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-obsidian text-white">
                <AppIcon name={item.icon} className="h-[21px] w-[21px]" />
              </span>
              <div className="min-w-0">
                <span className="font-label block text-[11px] font-semibold uppercase tracking-[0.2em] text-label">{item.title}</span>
                <span className="mt-1 block text-sm leading-relaxed text-warm-charcoal">{item.sub}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stories */}
      <section aria-labelledby="home-stories-title" className="bg-papyrus px-4 pb-14 pt-2 sm:px-6 md:pb-16 lg:px-8 lg:pb-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 text-center md:mb-10" data-reveal>
            <p className="font-label text-[11px] font-medium uppercase tracking-[0.32em] text-label">What People Say</p>
            <h2 id="home-stories-title" className="font-headline mt-3 text-[22px] font-medium tracking-tight text-obsidian md:text-[28px]">
              Early proof from the first rotation
            </h2>
          </div>
          <div className="-mx-4 flex gap-4 overflow-x-auto overflow-y-hidden px-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory md:mx-0 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0 md:pb-0 md:snap-none [&::-webkit-scrollbar]:hidden">
            {HOME_QUOTES.map((t, i) => (
              <div
                key={t.name}
                data-reveal={(['stagger-1', 'stagger-2', 'stagger-3'] as const)[i]}
                className="warm-glow-glass w-[85vw] max-w-sm shrink-0 snap-center space-y-6 rounded-[1.5rem] p-6 md:w-auto md:max-w-none md:shrink md:snap-none"
              >
                <p className="font-body text-[17px] italic leading-relaxed text-warm-charcoal md:text-[19px]">&ldquo;{t.quote}&rdquo;</p>
                <div className="h-px w-12 bg-desert-sand/40" />
                <div className="space-y-2">
                  <div className="font-headline text-[14px] font-medium uppercase tracking-widest text-clay">
                    — {t.name}
                    <span className="font-body block text-[13px] font-normal normal-case tracking-normal text-clay/80">{t.city}</span>
                  </div>
                  <Link
                    to={t.sourceHref}
                    className="font-label inline-flex items-center rounded-full border border-label/15 bg-white/55 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-clay transition-colors hover:border-clay/30 hover:text-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                  >
                    {t.sourceLabel}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* StoryBrand simple plan (domain-config storyPlanSteps) */}
      <section aria-labelledby="home-plan-title" className="bg-papyrus px-4 pb-8 sm:px-6 sm:pb-10 lg:px-8">
        <div className="mx-auto max-w-[1400px]">
          <h2 id="home-plan-title" className="sr-only">
            Simple plan
          </h2>
          <ol className="grid grid-cols-1 gap-3 border-y border-label/10 py-5 md:grid-cols-3 md:gap-5" data-reveal>
            {PDP_SCHEMA.storyPlanSteps.map((step, i) => (
              <li
                key={step}
                className="flex items-center gap-4 rounded-2xl px-2 py-2 md:justify-center"
                data-reveal={(['stagger-1', 'stagger-2', 'stagger-3'] as const)[i]}
              >
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/6 text-primary">
                  <AppIcon name={STORY_PLAN_STEP_ICONS[i]} className="h-[22px] w-[22px]" />
                </span>
                <span className="font-label text-[11px] uppercase tracking-[0.22em] text-label md:text-[12px]">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <ProductQuickView open={quickViewSlug !== null} productSlug={quickViewSlug} onClose={() => setQuickViewSlug(null)} />

      {/* Invite */}
      <section
        aria-labelledby="home-invite-title"
        className="border-t border-label/10 bg-papyrus px-4 py-16 text-center sm:px-6 md:py-20 lg:px-8 lg:py-24"
      >
        <div className="mx-auto max-w-4xl space-y-8 sm:space-y-10">
          <h2
            id="home-invite-title"
            data-reveal
            className="font-headline text-[22px] font-medium leading-tight tracking-tighter text-obsidian md:text-[32px] md:leading-[1.2]"
          >
            Find your word.
          </h2>
          <Link
            data-reveal="stagger-1"
            to="/vibes"
            className="home-hover-lift font-label inline-flex min-h-12 w-full max-w-sm items-center justify-center rounded-sm bg-primary px-10 py-6 text-sm font-medium uppercase tracking-[0.25em] text-obsidian shadow-xl transition-all duration-300 hover:scale-[1.03] hover:brightness-95 active:scale-95 sm:inline-block sm:w-auto sm:max-w-none sm:px-16"
          >
            Shop by Vibe
          </Link>
        </div>
      </section>
    </>
  );
}
