import { HOME_WHY_HORO_BLOCKS } from '../data/homeContent';
import { useUiLocale } from '../i18n/ui-locale';

function WhyIcon({ name }: { name: string }) {
  switch (name) {
    case 'localArtists':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-deep-teal/70">
          <path d="M12 19l7-7 3 3-7 7-3-3z" />
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
          <path d="M2 2l5 5" />
          <path d="M9.5 14.5L16 8" />
        </svg>
      );
    case 'heavyweightQuality':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-deep-teal/70">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    case 'personalMeaning':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-deep-teal/70">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      );
    default:
      return <span className="block h-1 w-12 rounded-full bg-deep-teal/65" />;
  }
}

export function HomeWhyHoro() {
  const { copy } = useUiLocale();

  return (
    <section
      aria-labelledby="home-why-horo-title"
      className="border-t border-stone/20 bg-papyrus px-4 py-12 sm:px-5 md:py-14 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <h2
          id="home-why-horo-title"
          data-reveal
          className="font-headline text-[1.6rem] font-semibold leading-tight tracking-tight text-obsidian md:text-[1.75rem]"
        >
          {copy.home.whyHoroTitle}
        </h2>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {HOME_WHY_HORO_BLOCKS.map((block, index) => {
            const content = copy.home.whyHoroBlocks[block.key];
            const reveal = (['stagger-1', 'stagger-2', 'stagger-3'] as const)[index];

            return (
              <article
                key={block.key}
                data-reveal={reveal}
                className="home-why-block flex flex-col items-start rounded-[18px] border border-stone/55 bg-white/82 p-5 shadow-[0_18px_44px_-30px_rgba(26,26,26,0.18)] md:p-6"
              >
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-linen" aria-hidden>
                  <WhyIcon name={block.key} />
                </div>
                <h3 className="font-headline text-[1.05rem] font-semibold leading-tight tracking-tight text-obsidian md:text-[1.15rem]">
                  {content.title}
                </h3>
                <p className="mt-2 font-body text-[15px] leading-relaxed text-warm-charcoal">
                  {content.body}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
