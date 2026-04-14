export function HomeFeelingExplosion() {
  return (
    <section
      aria-labelledby="home-feeling-title"
      className="home-feeling-glow flex min-h-[85vh] items-center border-t border-stone/25 bg-papyrus px-4 py-32 text-center sm:px-6 md:py-48 lg:px-8"
    >
      <div className="mx-auto max-w-3xl">
        {/* Decorative accent line */}
        <div data-reveal className="mx-auto mb-5 h-px w-12 bg-ember/50" aria-hidden="true" />

        <p
          data-reveal="stagger-1"
          className="font-label text-[10px] font-medium uppercase tracking-[0.3em] text-label"
        >
          The feeling
        </p>

        <h2
          id="home-feeling-title"
          data-reveal="stagger-2"
          className="font-headline mx-auto mt-6 max-w-2xl text-[clamp(2rem,5.5vw,3.5rem)] font-medium leading-[1.1] tracking-tight text-obsidian md:mt-8"
        >
          You know that feeling when <em className="not-italic text-clay">nothing says what you&apos;re thinking?</em>
        </h2>

        <p
          data-reveal="stagger-3"
          className="mx-auto mt-6 max-w-lg font-body text-[15px] leading-relaxed text-warm-charcoal md:mt-8 md:text-base"
        >
          HORO is for when you&apos;re ready to wear the thought out loud.
        </p>
      </div>
    </section>
  );
}
