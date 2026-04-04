import { useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MerchProductCard } from '../components/MerchProductCard';
import { ProductQuickView } from '../components/ProductQuickView';
import { HomeStickyVibeShowcase } from '../components/HomeStickyVibeShowcase';
import { HomeHeroWearMean } from '../components/HomeHeroWearMean';
import { HomeFeelingExplosion } from '../components/HomeFeelingExplosion';
import { HomeProofSplit } from '../components/HomeProofSplit';
import { HomeStoryQuotes } from '../components/HomeStoryQuotes';
import { RecentlyViewedStrip } from '../components/RecentlyViewedStrip';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { getProductMedia } from '../data/images';
import { getVibe, products } from '../data/site';
import { HOME_COPY, HOME_ORIENTATION_STEPS } from '../data/homeContent';
import { notifyHomeWaitlistSignup } from '../utils/homeWaitlist';

export function Home() {
  useScrollReveal();
  const [searchParams, setSearchParams] = useSearchParams();
  const latestDrops = products.slice(0, 4);
  const [quickViewSlug, setQuickViewSlug] = useState<string | null>(null);
  const [waitlistContact, setWaitlistContact] = useState('');
  const [waitlistStatus, setWaitlistStatus] = useState<'idle' | 'success' | 'error'>('idle');

  function handleWaitlistSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalized = waitlistContact.trim();
    if (!normalized || normalized.length < 5) {
      setWaitlistStatus('error');
      return;
    }

    notifyHomeWaitlistSignup(normalized);
    setWaitlistContact('');
    setWaitlistStatus('success');
  }

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
    <div className="home-grain">
      <HomeHeroWearMean />

      <HomeFeelingExplosion />

      <HomeStickyVibeShowcase />

      {/* Latest drop */}
      <section
        aria-labelledby="home-latest-drop-title"
        className="border-t border-stone/20 bg-papyrus px-4 py-16 sm:px-6 md:py-20 lg:px-8"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2
                id="home-latest-drop-title"
                data-reveal
                className="font-headline text-xl font-medium tracking-tight text-obsidian md:text-2xl"
              >
                Latest drop
              </h2>
            </div>
            <Link
              data-reveal="stagger-1"
              to="/vibes"
              className="cta-ember-glow font-label inline-flex min-h-10 w-fit items-center justify-center border border-obsidian/80 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-obsidian transition-colors hover:border-obsidian hover:bg-obsidian hover:text-clean-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
            >
              Shop by vibe
            </Link>
          </div>
          <div className="grid grid-cols-1 items-stretch gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
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
                  proofChip="220 GSM cotton"
                  variant="minimal"
                  onQuickView={setQuickViewSlug}
                  className="relative h-full"
                  data-reveal={(['stagger-1', 'stagger-2', 'stagger-3', 'stagger-4'] as const)[i]}
                />
              );
            })}
          </div>
        </div>
      </section>

      <RecentlyViewedStrip />

      <HomeProofSplit />

      <HomeStoryQuotes />

      {/* Simple plan */}
      <section aria-labelledby="home-plan-title" className="border-t border-stone/20 bg-papyrus px-4 py-14 sm:px-6 md:py-16 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 text-center md:mb-10" data-reveal>
            <p className="font-label text-[10px] font-medium uppercase tracking-[0.24em] text-label">{HOME_COPY.planEyebrow}</p>
            <h2 id="home-plan-title" className="font-headline mt-2 text-xl font-medium tracking-tight text-obsidian md:text-2xl">
              {HOME_COPY.planTitle}
            </h2>
          </div>
          <ol
            className="grid list-none grid-cols-1 gap-6 border-y border-stone/20 py-8 md:grid-cols-[minmax(0,1fr)_2.75rem_minmax(0,1fr)_2.75rem_minmax(0,1fr)] md:items-start md:gap-y-0 md:py-10"
            data-reveal
          >
            {HOME_ORIENTATION_STEPS.flatMap((step, i) => {
              const stepReveal = (['stagger-1', 'stagger-2', 'stagger-3'] as const)[i];
              const stepColumn = (['md:col-start-1', 'md:col-start-3', 'md:col-start-5'] as const)[i];
              const connectorColumn = (['md:col-start-2', 'md:col-start-4'] as const)[i];

              return [
                <li
                  key={step.title}
                  className={`flex flex-col items-center gap-4 px-2 text-center md:px-3 ${stepColumn}`}
                  data-reveal={stepReveal}
                >
                  <span className="font-label inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-desert-sand/30 text-sm font-semibold tracking-[0.18em] text-clay">
                    {`0${i + 1}`}
                  </span>
                  <h3 className="font-headline max-w-56 text-[0.95rem] font-medium leading-snug tracking-tight text-obsidian md:text-[1.02rem]">
                    {step.title}
                  </h3>
                  <p className="max-w-64 font-body text-sm leading-relaxed text-warm-charcoal">
                    {step.body}
                  </p>
                </li>,
                i < HOME_ORIENTATION_STEPS.length - 1 ? (
                  <li
                    key={`${step.title}-connector`}
                    aria-hidden="true"
                    role="presentation"
                    className={`hidden list-none items-center ${connectorColumn} md:flex`}
                  >
                    <span className="block h-px w-full border-t border-dashed border-stone/75" />
                  </li>
                ) : null,
              ];
            })}
          </ol>
        </div>
      </section>

      <ProductQuickView open={quickViewSlug !== null} productSlug={quickViewSlug} onClose={() => setQuickViewSlug(null)} />

      {/* Invite — closing viewport emphasis; Ember primary CTA (second of two on page) */}
      <section
        aria-labelledby="home-invite-title"
        className="border-t border-stone/20 bg-papyrus px-4 py-24 sm:px-6 md:py-32 lg:px-8"
      >
        <div className="mx-auto max-w-lg">
          <div
            data-reveal
            className="warm-glow-glass rounded-2xl border-stone/35 px-6 py-14 text-center sm:px-10 sm:py-16 md:px-12 md:py-18"
          >
            <h2
              id="home-invite-title"
              className="font-headline text-xl font-medium leading-tight tracking-tight text-obsidian md:text-2xl"
            >
              Find your word
            </h2>
            <p data-reveal="stagger-1" className="mx-auto mt-4 max-w-md font-body text-sm leading-relaxed text-warm-charcoal md:text-[15px]">
              {HOME_COPY.inviteBody}
            </p>
            <Link
              data-reveal="stagger-2"
              to="/vibes"
              className="cta-ember-glow font-label mt-8 inline-flex min-h-11 w-full max-w-xs items-center justify-center bg-ember px-8 py-3.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-obsidian transition-colors hover:bg-ember/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal sm:w-auto"
            >
              Shop by vibe
            </Link>
            <form
              data-reveal="stagger-3"
              onSubmit={handleWaitlistSubmit}
              className="mx-auto mt-8 flex max-w-md flex-col gap-2 border border-stone/25 bg-glass-white/72 px-3 py-3 backdrop-blur-sm sm:flex-row sm:items-stretch"
            >
              <label htmlFor="home-waitlist-contact" className="sr-only">
                WhatsApp number or Email
              </label>
              <input
                id="home-waitlist-contact"
                type="text"
                value={waitlistContact}
                onChange={(event) => {
                  setWaitlistContact(event.target.value);
                  if (waitlistStatus !== 'idle') setWaitlistStatus('idle');
                }}
                className="min-h-11 flex-1 border border-transparent bg-papyrus px-3 font-body text-sm text-obsidian outline-none transition-colors placeholder:text-clay/70 focus:border-stone/40"
                placeholder="WhatsApp number or Email"
                aria-invalid={waitlistStatus === 'error'}
              />
              <button
                type="submit"
                className="font-label inline-flex min-h-11 items-center justify-center bg-obsidian px-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-clean-white transition-colors hover:bg-obsidian/90"
              >
                {HOME_COPY.waitlistSubmit}
              </button>
            </form>
            <p className="mx-auto mt-3 font-body text-xs text-clay/90 md:text-sm">
              {waitlistStatus === 'success'
                ? HOME_COPY.waitlistSuccess
                : waitlistStatus === 'error'
                  ? HOME_COPY.waitlistError
                  : HOME_COPY.waitlistNote}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
