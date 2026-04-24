import { useUiLocale } from '../i18n/ui-locale';

/**
 * "Behind the piece" — text-only proof cards about artwork direction,
 * printing, and fit/care. Always renders; no fake imagery.
 */
export function HomeBehindThePiece() {
  const { copy } = useUiLocale();

  const cards = copy.home.behindThePieceCards;

  return (
    <section
      aria-labelledby="home-behind-the-piece-title"
      className="border-t border-stone/20 bg-papyrus px-4 py-12 sm:px-5 md:py-14 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <p className="font-label text-[12px] font-semibold uppercase tracking-[0.2em] text-label">
          {copy.home.behindThePieceEyebrow}
        </p>
        <h2
          id="home-behind-the-piece-title"
          data-reveal
          className="font-headline mt-2 max-w-lg text-[1.6rem] font-semibold leading-tight tracking-tight text-obsidian md:text-[1.75rem]"
        >
          {copy.home.behindThePieceTitle}
        </h2>
        <p className="font-body mt-3 max-w-xl text-[15px] leading-relaxed text-warm-charcoal">
          {copy.home.behindThePieceBody}
        </p>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
          {cards.map((card) => (
            <div
              key={card.title}
              data-reveal="stagger-1"
              className="rounded-2xl border border-stone/30 bg-white p-5 shadow-sm"
            >
              <h3 className="font-headline text-base font-semibold text-obsidian">
                {card.title}
              </h3>
              <p className="font-body mt-2 text-sm leading-relaxed text-warm-charcoal">
                {card.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
