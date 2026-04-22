import { HOME_WHY_HORO_BLOCKS } from '../data/homeContent';
import { useUiLocale } from '../i18n/ui-locale';

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
                className="home-why-block rounded-[18px] border border-stone/55 bg-white/82 p-5 shadow-[0_18px_44px_-30px_rgba(26,26,26,0.18)] md:p-6"
              >
                <span aria-hidden className="mb-5 block h-1 w-12 rounded-full bg-deep-teal/65" />
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
