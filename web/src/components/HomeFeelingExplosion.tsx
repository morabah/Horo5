export function HomeFeelingExplosion() {
  return (
    <section
      aria-labelledby="home-feeling-title"
      className="relative overflow-hidden bg-obsidian px-4 py-20 text-white sm:px-6 md:py-24 lg:px-8"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(232,89,60,0.18),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_55%)]" aria-hidden />

      <div className="relative mx-auto flex max-w-5xl flex-col gap-6 text-center">
        <p
          data-reveal
          className="font-label text-[11px] font-medium uppercase tracking-[0.28em] text-white/62"
        >
          The feeling
        </p>
        <h2
          id="home-feeling-title"
          data-reveal="stagger-1"
          className="font-headline mx-auto max-w-4xl text-[clamp(2.4rem,6vw,5.25rem)] font-semibold uppercase leading-[0.88] tracking-[-0.04em] text-[#f5f0e8]"
        >
          Nothing in your closet says what you&apos;re thinking.
        </h2>
        <p
          data-reveal="stagger-2"
          className="font-body mx-auto max-w-2xl text-[16px] leading-relaxed text-stone sm:text-[18px]"
        >
          HORO starts with the feeling first, then turns it into a design you can recognize in one glance.
        </p>
      </div>
    </section>
  );
}
