import { Link } from 'react-router-dom';
import { vibes, type Vibe } from '../data/site';

type VibeJumpChipProps = {
  vibe: Vibe;
};

function VibeJumpChip({ vibe }: VibeJumpChipProps) {
  return (
    <Link
      to={`/?vibe=${vibe.slug}`}
      aria-label={`Jump to the ${vibe.name} vibe cards below`}
      className="home-glass-chip font-label inline-flex min-h-11 items-center gap-3 rounded-full px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-obsidian transition-all duration-300 hover:-translate-y-0.5 hover:border-obsidian/22 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal sm:text-[11px]"
    >
      <span
        className="h-2.5 w-2.5 rounded-full shadow-[0_0_0_4px_rgba(255,255,255,0.68)]"
        style={{ backgroundColor: vibe.accent }}
        aria-hidden
      />
      {vibe.name}
    </Link>
  );
}

export function HomeVibeFocusPanel() {
  return (
    <section className="mt-8 sm:mt-10" aria-labelledby="home-vibe-focus-title">
      <article
        className="home-glass-frame relative isolate flex min-h-[24rem] flex-col overflow-hidden rounded-[2rem] px-6 py-6 sm:px-7 sm:py-7 lg:px-10 lg:py-9"
        data-reveal="stagger-1"
      >
        <div className="pointer-events-none absolute inset-[1px] rounded-[calc(2rem-1px)] border border-white/40" aria-hidden />
        <div
          className="pointer-events-none absolute inset-0 opacity-95"
          style={{
            background:
              'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.65) 0%, transparent 34%), radial-gradient(circle at 50% 88%, rgba(232,89,60,0.16) 0%, transparent 36%)',
          }}
          aria-hidden
        />
        <div className="relative z-10 flex h-full flex-col items-center text-center">
          <p className="font-label text-[10px] uppercase tracking-[0.24em] text-clay/72 sm:text-[11px]">Start with the one that feels like you</p>
          <h3
            id="home-vibe-focus-title"
            className="font-headline mt-5 text-balance text-[clamp(2.65rem,5.8vw,5rem)] font-semibold leading-[0.9] tracking-[-0.055em] text-obsidian"
          >
            Find your <span className="text-primary">vibe</span>
          </h3>
          <p className="font-body mt-5 max-w-3xl text-[16px] leading-relaxed text-warm-charcoal/88 sm:text-[18px]">
            Five lines. Five moods. Pick the one that feels closest to you, then drop straight into the edit below.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-2.5 sm:gap-3">
            {vibes.map((vibe) => (
              <VibeJumpChip key={vibe.slug} vibe={vibe} />
            ))}
          </div>
          <Link
            to="/vibes"
            className="font-label mt-8 inline-flex min-h-12 items-center justify-center rounded-sm bg-obsidian px-6 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-white transition-colors hover:bg-obsidian/92 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal sm:mt-10"
          >
            Shop by Vibe
          </Link>
        </div>
      </article>
    </section>
  );
}
